"use client";

import React, { useState, useEffect } from "react";

type ReportType =
  | "spoofing"
  | "multi"
  | "software"
  | "item"
  | "attack"
  | "other";

const reportTypeMap = {
  spoofing: {
    titleFile: "/reports/title_spoofing.txt",
    contentFile: "/reports/spoofing.txt",
    label: "Falsifying location",
  },
  multi: {
    titleFile: "/reports/title_multi.txt",
    contentFile: "/reports/multi.txt",
    label: "Multiple account",
  },
  software: {
    titleFile: "/reports/title_software.txt",
    contentFile: "/reports/software.txt",
    label: "Using third party software",
  },
  item: {
    titleFile: "/reports/title_item.txt",
    contentFile: "/reports/item.txt",
    label: "Trading or selling items",
  },
  attack: {
    titleFile: "/reports/title_attack.txt",
    contentFile: "/reports/attack.txt",
    label: "Unrealistic Portal Attack",
  },
  other: {
    titleFile: "/reports/title_other.txt",
    contentFile: "/reports/other.txt",
    label: "Others",
  },
};

const timestampRegex =
  /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:\s*(?:GMT|UTC)?[+\-]\d{1,2}(?::?\d{2})?)?$/;

function validateTimestamp(ts: string) {
  console.log(`Validating timestamp: "${ts}" `, timestampRegex.test(ts.trim()));
  return timestampRegex.test(ts.trim());
}

function generateRandomTimestampWithin30Days() {
  const now = new Date();
  const past30DaysMs = 30 * 24 * 60 * 60 * 1000;
  const randomOffset = Math.floor(Math.random() * past30DaysMs);
  const randomDate = new Date(now.getTime() - randomOffset);

  // Adjust to UTC+8 manually
  const gmt8Date = new Date(randomDate.getTime() + 8 * 60 * 60 * 1000);

  const pad = (n: number, digits = 2) => n.toString().padStart(digits, "0");
  const year = gmt8Date.getUTCFullYear();
  const month = pad(gmt8Date.getUTCMonth() + 1);
  const day = pad(gmt8Date.getUTCDate());
  const hour = pad(gmt8Date.getUTCHours());
  const minute = pad(gmt8Date.getUTCMinutes());
  const second = pad(gmt8Date.getUTCSeconds());
  const ms = pad(gmt8Date.getUTCMilliseconds(), 3);

  return `${year}-${month}-${day} ${hour}:${minute}:${second}.${ms} UTC+8`;
}

export default function GenReportPage() {
  const [reportType, setReportType] = useState<ReportType>("spoofing");
  const [userCodename, setUserCodename] = useState("");
  const [cheaterCodename, setCheaterCodename] = useState("");
  const [cheatLink, setCheatLink] = useState("");
  const [showLinksInput, setShowLinksInput] = useState(true);
  const [timestampLinks, setTimestampLinks] = useState<
    { timestamp: string; link: string }[]
  >([{ timestamp: "", link: "" }]);

  const [titles, setTitles] = useState<string[]>([]);
  const [contents, setContents] = useState<string[]>([]);
  const [resultTitle, setResultTitle] = useState<string | null>(null);
  const [resultContent, setResultContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cheatTimestamp, setCheatTimestamp] = useState(() => {
    const now = new Date();

    const pad = (n: number) => n.toString().padStart(2, "0");

    // Convert to Asia/Hong_Kong time manually
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const hongKongOffset = 8 * 60 * 60000; // GMT+8
    const hkDate = new Date(utc + hongKongOffset);

    const year = hkDate.getFullYear();
    const month = pad(hkDate.getMonth() + 1);
    const day = pad(hkDate.getDate());

    const hours = pad(hkDate.getHours());
    const minutes = pad(hkDate.getMinutes());
    const seconds = pad(hkDate.getSeconds());

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} GMT+8:00`;
  });
  const [copied, setCopied] = useState(false);
  const { titleFile, contentFile } = reportTypeMap[reportType];
  const handleCopy = () => {
    if (!resultContent) return;
    navigator.clipboard
      .writeText(resultContent)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000); // reset after 2 seconds
      })
      .catch(() => {
        alert("Failed to copy");
      });
  };
  // Load titles and contents when reportType changes
  useEffect(() => {
    async function loadFiles() {
      setResultTitle(null);
      setResultContent(null);
      setError(null);
      setShowLinksInput(true);
      setTimestampLinks([{ timestamp: "", link: "" }]);

      try {
        // Load titles
        const titleRes = await fetch(titleFile);
        if (!titleRes.ok) throw new Error("Failed to load titles");
        const titleText = await titleRes.text();
        const titlesArr = titleText
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean);

        // Load contents
        const contentRes = await fetch(contentFile);
        if (!contentRes.ok) throw new Error("Failed to load contents");
        const contentText = await contentRes.text();
        // Split by --- separator
        const contentsArr = contentText
          .split("---")
          .map((c) => c.trim())
          .filter(Boolean);

        setTitles(titlesArr);
        setContents(contentsArr);
      } catch (e) {
        setError((e as Error).message);
      }
    }
    loadFiles();
  }, [reportType]);

  // Handle adding another timestamp+link pair (max 5)
  function addTimestampLink() {
    if (timestampLinks.length < 5) {
      setTimestampLinks([...timestampLinks, { timestamp: "", link: "" }]);
    }
  }

  // Handle removing a timestamp+link pair by index
  function removeTimestampLink(index: number) {
    setTimestampLinks(timestampLinks.filter((_, i) => i !== index));
  }

  // Replace placeholders in text
  function replacePlaceholders(
    text: string,
    user: string,
    cheater: string,
    mainTimestamp: string,
    cheatLink: string,
    timestampLinks: { timestamp: string; link: string }[]
  ) {
    // Replace codename and cheater
    let replaced = text
      .replace(/\[codename\]/gi, user)
      .replace(/\[cheater\]/gi, cheater);

    // Replace [timestamp] with mainTimestamp or remove if empty string
    if (mainTimestamp) {
      replaced = replaced.replace(/\[timestamp\]/gi, mainTimestamp);
    } else {
      replaced = replaced.replace(/\[timestamp\]/gi, "");
    }

    // Replace [link] with cheatLink if present, else remove placeholder
    if (/\[link\]/i.test(replaced)) {
      let combinedLinkBlock = cheatLink.trim();

      for (let i = 0; i < 5 && i < timestampLinks.length; i++) {
        const ts = validateTimestamp(timestampLinks[i].timestamp)
          ? timestampLinks[i].timestamp
          : generateRandomTimestampWithin30Days();
        const link = timestampLinks[i].link.trim();
        if (ts || link) {
          if (i == 0) 
            combinedLinkBlock += `${ts}\n${link}`;
          else combinedLinkBlock += `\n${ts}\n${link}`;
        
      }

      replaced = replaced.replace(/\[link\]/gi, combinedLinkBlock);
    } else {
      replaced = replaced.replace(/\[link\]/gi, "");
    }
    return replaced;
  }
  function onSubmit() {
    setError(null);
    setResultTitle(null);
    setResultContent(null);

    if (!userCodename.trim()) {
      setError("Please enter your codename.");
      return;
    }
    if (!cheaterCodename.trim()) {
      setError("Please enter the cheater's codename.");
      return;
    }

    // Validate main timestamp
    let mainTimestampValid = validateTimestamp(cheatTimestamp.trim());
    let mainTimestamp = mainTimestampValid
      ? cheatTimestamp.trim()
      : generateRandomTimestampWithin30Days();

    // Validate all timestampLinks timestamps, if invalid treat as empty
    const cleanedTimestampLinks = timestampLinks.map(({ timestamp, link }) => ({
      timestamp: timestamp.trim(), // keep original timestamp as is
      link: link.trim(),
    }));
    if (titles.length === 0 || contents.length === 0) {
      setError("Report templates are not loaded properly.");
      return;
    }

    // Random pick title and content
    const title = titles[Math.floor(Math.random() * titles.length)];
    const content = contents[Math.floor(Math.random() * contents.length)];

    // Replace placeholders
    const replacedTitle = title
      .replace(/\[codename\]/gi, userCodename.trim())
      .replace(/\[cheater\]/gi, cheaterCodename.trim())
      .replace(/\[timestamp\]/gi, mainTimestamp);
    const replacedContent = replacePlaceholders(
      content,
      userCodename.trim(),
      cheaterCodename.trim(),
      mainTimestamp,
      cheatLink.trim(),
      cleanedTimestampLinks
    );

    setResultTitle(replacedTitle);
    setResultContent(replacedContent);
  }

  return (
    <>
      <style>{`
        * {
          box-sizing: border-box;
        }
        .container {
          max-width: 600px;
          margin: 2rem auto;
          padding: 1rem;
          background: #f9fafb;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgb(0 0 0 / 0.1);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
            Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
        }
        .container img, .preview img, img.link-preview {
          display: none !important;
        }
        h1 {
          text-align: center;
          margin-bottom: 1rem;
          color: #1f2937;
        }
        label {
          display: block;
          font-weight: 600;
          margin: 1rem 0 0.5rem;
          color: #374151;
        }
        select,
        input[type="text"],
        input[type="datetime"],
        input[type="datetime-local"] {
          width: 100%;
          padding: 0.5rem 0.75rem;
          font-size: 1rem;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          transition: border-color 0.2s;
        }
        select:focus,
        input[type="text"]:focus {
          border-color: #2563eb;
          outline: none;
          box-shadow: 0 0 0 3px rgb(59 130 246 / 0.3);
        }
        .button {
          margin-top: 1.5rem;
          width: 100%;
          background-color: #2563eb;
          color: white;
          font-weight: 700;
          font-size: 1.1rem;
          padding: 0.75rem;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: background-color 0.3s ease;
        }
        .button:hover {
          background-color: #1d4ed8;
        }
        .result {
          margin-top: 2rem;
          padding: 1rem;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgb(0 0 0 / 0.1);
          white-space: pre-wrap;
          color: #111827;
        }
        .error {
          margin-top: 1rem;
          color: #dc2626;
          font-weight: 700;
          text-align: center;
        }
        .timestamp-link-row {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
        }
        .timestamp-link-row input[type="text"] {
          flex: 1;
        }
        .remove-btn {
          background: #ef4444;
          border: none;
          color: white;
          padding: 0 0.6rem;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 700;
        }
        .add-btn {
          background: #10b981;
          border: none;
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 700;
          margin-bottom: 1rem;
        }
        .result {
          max-width: 600px;
          margin: 2rem auto;
          padding: 1rem;
          background: #f9fafb;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgb(0 0 0 / 0.1);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
            Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
          overflow-wrap: break-word; /* prevent overflow of long words */
          word-break: break-word;    /* safer break for older browsers */
          white-space: pre-wrap;     /* keep newlines and wrap text */
        }
        .result pre {
          white-space: pre-wrap;      /* Wrap lines and preserve whitespace */
          word-break: break-word;     /* Break long words if needed */
          overflow-wrap: break-word;  /* Ensure wrapping on overflow */
          max-width: 100%;            /* Prevent width overflow */
        }
        @media (max-width: 480px) {
          .timestamp-link-row {
            flex-direction: column;
          }
          .remove-btn {
            align-self: flex-start;
            margin-top: 0.5rem;
          }
        }
      `}</style>
      <div className="container">
        <div className="mb-4 text-gray-700 text-sm">
          <p>
            This tool generates a report based on your selected{" "}
            <strong>report type</strong>:{" "}
            <em>{reportTypeMap[reportType].label}</em>.
            <br />
          </p>

          <table className="table-auto border-collapse border border-gray-300 mt-3 w-full text-left text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-3 py-1">
                  Report Type
                </th>
                <th className="border border-gray-300 px-3 py-1"># Titles</th>
                <th className="border border-gray-300 px-3 py-1"># Contents</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 px-3 py-1">
                  {reportTypeMap[reportType].label}
                </td>
                <td className="border border-gray-300 px-3 py-1">
                  {titles.length}
                </td>
                <td className="border border-gray-300 px-3 py-1">
                  {contents.length}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <label htmlFor="report-type">Select report type:</label>
        <select
          id="report-type"
          value={reportType}
          onChange={(e) => setReportType(e.target.value as ReportType)}
        >
          {Object.entries(reportTypeMap).map(([key, val]) => (
            <option key={key} value={key}>
              {val.label}
            </option>
          ))}
        </select>

        <label htmlFor="user-codename">Your codename:</label>
        <input
          id="user-codename"
          type="text"
          value={userCodename}
          onChange={(e) => setUserCodename(e.target.value)}
          placeholder="Enter your codename"
        />
        <small className="text-gray-600">
          This will replace [codename] in the report.
        </small>

        <label htmlFor="cheater-codename">Cheater&apos;s codename:</label>
        <input
          id="cheater-codename"
          type="text"
          value={cheaterCodename}
          onChange={(e) => setCheaterCodename(e.target.value)}
          placeholder="Enter cheater's codename"
        />
        <small className="text-gray-600">
          This will replace [cheater] in the report.
        </small>

        <label htmlFor="cheat-timestamp" className="block font-semibold mb-1">
          Timestamp (optional):
        </label>
        <input
          id="cheat-timestamp"
          type="text"
          onChange={(e) => setCheatTimestamp(e.target.value)}
          value={cheatTimestamp}
          placeholder="YYYY-MM-DD HH:MM:SS UTC+08:00"
          className="input w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-blue-300"
        />
        <small className="text-gray-600">
          Auto-generate from 30 days if leaving blank or the format is wrong.
          Default timezone UTC+8 will be used if timezone missing or wrong
          format. This will replace [timestamp] in the report.
        </small>

        <label htmlFor="intel-link" className="block font-semibold mb-1">
          Intel Link (optional):
        </label>
        <input
          id="intel-link"
          type="text"
          placeholder="Intel or portal link"
          value={cheatLink}
          onChange={(e) => setCheatLink(e.target.value)}
          className="input mt-2"
        />
        <small className="text-gray-600">
          This will replace [link] in the report. Any additional links and
          timestamps will be added below.
        </small>
        {showLinksInput && (
          <>
            <label>Additional Intel Links and Timestamps (optional):</label>
            {timestampLinks.map((pair, i) => (
              <div className="timestamp-link-row" key={i}>
                <input
                  type="text"
                  placeholder="YYYY-MM-DD HH:MM:SS UTC+08:00"
                  value={pair.timestamp}
                  onChange={(e) => {
                    const newPairs = [...timestampLinks];
                    newPairs[i].timestamp = e.target.value;
                    setTimestampLinks(newPairs);
                  }}
                />

                <input
                  type="text"
                  value={pair.link}
                  onChange={(e) => {
                    const newPairs = [...timestampLinks];
                    newPairs[i].link = e.target.value;
                    setTimestampLinks(newPairs);
                  }}
                />

                {timestampLinks.length > 1 && (
                  <button
                    type="button"
                    className="remove-btn"
                    aria-label={`Remove timestamp-link pair ${i + 1}`}
                    onClick={() => removeTimestampLink(i)}
                  >
                    &times;
                  </button>
                )}
              </div>
            ))}

            {timestampLinks.length < 5 && (
              <button
                type="button"
                className="add-btn"
                onClick={addTimestampLink}
                aria-label="Add another timestamp-link pair"
              >
                + Add more
              </button>
            )}
          </>
        )}

        <button
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded shadow button"
          onClick={onSubmit}
        >
          Generate Report
        </button>

        {error && <div className="error">{error}</div>}

        {resultTitle && resultContent && (
          <div className="result" aria-live="polite">
            <h2>{resultTitle}</h2>
            <hr />
            <button
              onClick={handleCopy}
              aria-label="Copy result content"
              style={{
                cursor: "pointer",
                fontSize: "1.2rem",
                border: "none",
                background: "transparent",
                padding: "0.2rem",
              }}
              title={copied ? "Copied!" : "Copy to clipboard"}
            >
              {copied ? "✅" : "📋"}
            </button>
            <pre>{resultContent}</pre>
          </div>
        )}
      </div>
    </>
  );
}
