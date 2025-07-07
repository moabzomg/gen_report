import { Check, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Question } from "@/lib/schemas";

interface QuizReviewProps {
  questions: Question[];
  userAnswers: string[][];
}

export default function QuizReview({
  questions,
  userAnswers,
}: QuizReviewProps) {
  const answerLabels: (
    | "A"
    | "B"
    | "C"
    | "D"
    | "E"
    | "F"
    | "G"
    | "H"
    | "I"
    | "J"
    | "K"
    | "L"
    | "M"
    | "N"
    | "O"
    | "P"
    | "Q"
    | "R"
    | "S"
    | "T"
    | "U"
    | "V"
    | "W"
    | "X"
    | "Y"
    | "Z"
  )[] = [
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G",
    "H",
    "I",
    "J",
    "K",
    "L",
    "M",
    "N",
    "O",
    "P",
    "Q",
    "R",
    "S",
    "T",
    "U",
    "V",
    "W",
    "X",
    "Y",
    "Z",
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Quiz Review</CardTitle>
      </CardHeader>
      <CardContent>
        {questions.map((question, questionIndex) => {
          const correctAnswers = question.answer; // Array of correct answers (["A", "C"])
          const selectedAnswers = userAnswers[questionIndex] || []; // Array of user-selected answers

          return (
            <div key={questionIndex} className="mb-8 last:mb-0">
              <h3 className="text-lg font-semibold mb-4">
                Question {questionIndex + 1}:{" "}
                <span dangerouslySetInnerHTML={{ __html: question.question }} />
              </h3>
              <div className="space-y-2">
                {question.options.map((option, optionIndex) => {
                  const currentLabel = answerLabels[optionIndex];
                  const isCorrect = correctAnswers.includes(currentLabel); // Check if it's a correct answer
                  const isSelected = selectedAnswers.includes(currentLabel); // Check if the user selected it
                  const isIncorrectSelection = isSelected && !isCorrect; // Selected but incorrect

                  return (
                    <div
                      key={optionIndex}
                      className={`flex items-center p-4 rounded-lg ${
                        isCorrect
                          ? "bg-green-100 dark:bg-green-700/50"
                          : isIncorrectSelection
                          ? "bg-red-100 dark:bg-red-700/50"
                          : "border border-border"
                      }`}
                    >
                      <span className="text-lg font-medium mr-4 w-6">
                        {currentLabel}
                      </span>
                      <span className="flex-grow">{option}</span>
                      {isCorrect && (
                        <Check
                          className="ml-2 text-green-600 dark:text-green-400"
                          size={20}
                        />
                      )}
                      {isIncorrectSelection && (
                        <X
                          className="ml-2 text-red-600 dark:text-red-400"
                          size={20}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
              <div
                className="mt-4 text-m"
                dangerouslySetInnerHTML={{ __html: question.explanation }}
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
