"use client";

import React, { useState, useEffect } from "react";

type ReportType = "spoofing" | "multi" | "software" | "other";

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
  other: {
    titleFile: "/reports/title_other.txt",
    contentFile: "/reports/other.txt",
    label: "Others",
  },
};

const timestampRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} GMT[+\-]\d{1,2}:\d{2}$/;

function validateTimestamp(ts: string) {
  return timestampRegex.test(ts.trim());
}

function generateTimestamp30DaysAgo() {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  // Format as "YYYY-MM-DD HH:mm:ss GMT+8:00"
  const pad = (n: number) => n.toString().padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hour = pad(date.getHours());
  const min = pad(date.getMinutes());
  const sec = pad(date.getSeconds());
  // Here assuming GMT+8:00 fixed, you can adjust if needed
  return `${year}-${month}-${day} ${hour}:${min}:${sec} GMT+8:00`;
}

export default function GenReportPage() {
  const [reportType, setReportType] = useState<ReportType>("spoofing");
  const [userCodename, setUserCodename] = useState("");
  const [cheaterCodename, setCheaterCodename] = useState("");
  const [cheatTimestamp, setCheatTimestamp] = useState("");
  const [cheatLink, setCheatLink] = useState("");
  const [showLinksInput, setShowLinksInput] = useState(false);
  const [timestampLinks, setTimestampLinks] = useState<
    { timestamp: string; link: string }[]
  >([{ timestamp: "", link: "" }]);

  const [titles, setTitles] = useState<string[]>([]);
  const [contents, setContents] = useState<string[]>([]);
  const [resultTitle, setResultTitle] = useState<string | null>(null);
  const [resultContent, setResultContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load titles and contents when reportType changes
  useEffect(() => {
    async function loadFiles() {
      setResultTitle(null);
      setResultContent(null);
      setError(null);
      setShowLinksInput(false);
      setTimestampLinks([{ timestamp: "", link: "" }]);

      try {
        const { titleFile, contentFile } = reportTypeMap[reportType];

        // Load titles
        const titleRes = await fetch(titleFile);
        if (!titleRes.ok) throw new Error("Failed to load titles");
        const titleText = await titleRes.text();
        const titlesArr = titleText.split("\n").map((l) => l.trim()).filter(Boolean);

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

  // When cheatTimestamp changes, decide to show link input box
  useEffect(() => {
  if (!cheatTimestamp || cheatTimestamp.trim() === "") {
    setShowLinksInput(false);
    setTimestampLinks([{ timestamp: "", link: "" }]);
  } else {
    setShowLinksInput(true);
  }
}, [cheatTimestamp]);

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
    timestampLinks: { timestamp: string; link: string }[]
  ) {
    // Replace codename and cheater
    let replaced = text
      .replace(/\[codename\]/gi, user)
      .replace(/\[cheater\]/gi, cheater);

    // Replace [timestamp] with mainTimestamp or remove if invalid
    if (mainTimestamp) {
      replaced = replaced.replace(/\[timestamp\]/gi, mainTimestamp);
    } else {
      replaced = replaced.replace(/\[timestamp\]/gi, "");
    }

    // For [link], replace with first link if valid, else remove placeholder
    if (timestampLinks.length > 0 && validateTimestamp(timestampLinks[0].timestamp) && timestampLinks[0].link.trim()) {
      replaced = replaced.replace(/\[link\]/gi, timestampLinks[0].link.trim());
    } else {
      replaced = replaced.replace(/\[link\]/gi, "");
    }

    // Replace [timestamp1], [link1], ..., [timestamp5], [link5]
    for (let i = 0; i < 5; i++) {
      const tsKey = new RegExp(`\\[timestamp${i + 1}\\]`, "gi");
      const linkKey = new RegExp(`\\[link${i + 1}\\]`, "gi");

      if (i < timestampLinks.length) {
        const tsVal = validateTimestamp(timestampLinks[i].timestamp)
          ? timestampLinks[i].timestamp
          : "";
        const linkVal = timestampLinks[i].link.trim();

        replaced = replaced.replace(tsKey, tsVal);
        replaced = replaced.replace(linkKey, tsVal && linkVal ? linkVal : "");
      } else {
        replaced = replaced.replace(tsKey, "");
        replaced = replaced.replace(linkKey, "");
      }
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
      : generateTimestamp30DaysAgo();

    // Validate all timestampLinks timestamps, if invalid treat as empty
    const cleanedTimestampLinks = timestampLinks.map(({ timestamp, link }) => ({
      timestamp: validateTimestamp(timestamp.trim()) ? timestamp.trim() : "",
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
    const replacedTitle = replacePlaceholders(
      title,
      userCodename.trim(),
      cheaterCodename.trim(),
      mainTimestamp,
      cleanedTimestampLinks
    );
    const replacedContent = replacePlaceholders(
      content,
      userCodename.trim(),
      cheaterCodename.trim(),
      mainTimestamp,
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
        <h1>Generate Report</h1>

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

        <label htmlFor="cheater-codename">Cheater&apos;s codename:</label>
        <input
          id="cheater-codename"
          type="text"
          value={cheaterCodename}
          onChange={(e) => setCheaterCodename(e.target.value)}
          placeholder="Enter cheater's codename"
        />

        <label htmlFor="cheat-timestamp" className="block font-semibold mb-1">
          Timestamp (optional):
        </label>
        <input
          id="cheat-timestamp"
          type="text"
          onChange={(e) => setCheatTimestamp(e.target.value)}
          placeholder="2025-07-03 10:22:33 GMT+8:00"
          value={cheatTimestamp || new Date().toLocaleString('en-GB', {
            timeZone: 'Asia/Hong_Kong',
            hour12: false,
          }).replace(',', '') + ' GMT+8:00'}
          className="input"
        />
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

        {/* Show link inputs if timestamp entered */}
        {showLinksInput && (
          <>
            <label>Intel link and timestamps (optional):</label>
            {timestampLinks.map((pair, i) => (
              <div className="timestamp-link-row" key={i}>
                <input
                  type="text"
                  placeholder={`Timestamp${i + 1} (format as above)`}
                  value={pair.timestamp}
                  onChange={(e) => {
                    const newPairs = [...timestampLinks];
                    newPairs[i].timestamp = e.target.value;
                    setTimestampLinks(newPairs);
                  }}
                />
                <input
                  type="text"
                  placeholder={`Link${i + 1}`}
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

        <button className="button" onClick={onSubmit}>
          Generate Report
        </button>

        {error && <div className="error">{error}</div>}

        {resultTitle && resultContent && (
          <div className="result whitespace-pre-wrap break-words w-full" aria-live="polite">
            <h2>{resultTitle}</h2>
            <hr />
            <pre>{resultContent}</pre>
          </div>
        )}
      </div>
    </>
  );
}
