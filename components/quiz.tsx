import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  RefreshCw,
  FileText,
} from "lucide-react";
import QuizScore from "./score";
import { Question } from "@/lib/schemas";
import QuizReview from "./quiz-overview";

type QuizProps = {
  questions: Question[];
  clearCSV: () => void;
  showAnswer: boolean;
};

const QuestionCard: React.FC<{
  question: Question;
  selectedAnswers: string[]; // Should only contain one selected answer
  onSelectAnswer: (answer: string) => void;
  isChecked: boolean;
  correctAnswers: string[];
  isSubmitted: boolean;
  showAnswer: boolean;
}> = ({
  question,
  selectedAnswers,
  onSelectAnswer,
  isChecked,
  correctAnswers,
  isSubmitted,
  showAnswer,
}) => {
  const answerLabels = Array.from({ length: 26 }, (_, i) =>
    String.fromCharCode(65 + i)
  );

  return (
    <div className="space-y-6">
      <h2
        className="text-lg font-semibold leading-tight"
        dangerouslySetInnerHTML={{ __html: question.question }}
      />
      <div className="grid grid-cols-1 gap-4">
        {question.options.map((option, index) => {
          const currentLabel = answerLabels[index];
          const isCorrect = correctAnswers.includes(currentLabel);
          const isSelected = selectedAnswers.includes(currentLabel);
          const isIncorrectSelection = isSelected && !isCorrect;

          return (
            <Button
              key={index}
              variant={isSelected ? "secondary" : "outline"}
              className={`h-auto py-6 px-4 justify-start text-left whitespace-normal
                ${
                  isChecked && isCorrect
                    ? "bg-green-600 hover:bg-green-700"
                    : ""
                }
                ${
                  isChecked && isIncorrectSelection
                    ? "bg-red-600 hover:bg-red-700"
                    : ""
                }
                ${isChecked && !isSelected && isCorrect ? "bg-green-300" : ""}
              `}
              onClick={() => {
                if (!isChecked) {
                  onSelectAnswer(currentLabel); // Allows changing the selection
                }
              }}
              disabled={isChecked} // Disable after checking
            >
              <span className="text-lg font-medium mr-4 shrink-0">
                {currentLabel}
              </span>
              <span className="flex-grow">{option}</span>

              {isChecked && isCorrect && (
                <Check className="ml-2 text-white" size={20} />
              )}
              {isChecked && isIncorrectSelection && (
                <X className="ml-2 text-white" size={20} />
              )}
            </Button>
          );
        })}
      </div>

      {/* Show explanation if isChecked is true */}
      {isChecked && showAnswer && (
        <div className="mt-4 p-4 border border-gray-300 rounded bg-gray-100">
          <h3 className="font-semibold text-lg text-gray-700">Explanation:</h3>
          <p
            className="text-gray-600"
            dangerouslySetInnerHTML={{ __html: question.explanation }}
          />
        </div>
      )}
    </div>
  );
};

export default function Quiz({ questions, clearCSV, showAnswer }: QuizProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<string[][]>(
    Array(questions.length).fill([])
  );
  const [isChecked, setIsChecked] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [scoreByTopic, setScoreByTopic] = useState<Record<string, number>>({});
  const [totalByTopic, setTotalByTopic] = useState<Record<string, number>>({});

  useEffect(() => {
    setProgress((currentQuestionIndex / questions.length) * 100);
  }, [currentQuestionIndex, questions.length]);

  const handleSelectAnswer = (answer: string) => {
    if (!isChecked) {
      const newAnswers = [...answers];
      const currentAnswers = newAnswers[currentQuestionIndex] || [];
      const correctAnswerCount = questions[currentQuestionIndex].answer.length;

      // If there are multiple correct answers, allow for adding/removing answers
      if (correctAnswerCount > 1) {
        if (currentAnswers.includes(answer)) {
          // If answer is already selected, remove it
          newAnswers[currentQuestionIndex] = currentAnswers.filter(
            (a) => a !== answer
          );
        } else {
          // If answer is not selected, check if the user is trying to select more than the allowed answers
          if (currentAnswers.length < correctAnswerCount) {
            newAnswers[currentQuestionIndex] = [...currentAnswers, answer];
          } else {
            // Show error if the user tries to select more answers than allowed
            setErrorMessage(
              `You can only select ${correctAnswerCount} answer${
                correctAnswerCount > 1 ? "s" : ""
              }. Please deselect a previous answer before adding a new one.`
            );
          }
        }
      } else {
        // Single correct answer scenario: Only 1 answer can be selected at a time
        newAnswers[currentQuestionIndex] = [answer]; // Reset to only the selected answer
      }

      setAnswers(newAnswers);
    }
  };

  const handleCheckAnswer = () => {
    const correctAnswerCount = questions[currentQuestionIndex].answer.length;
    const selectedAnswersForCurrentQuestion =
      answers[currentQuestionIndex] || [];

    if (selectedAnswersForCurrentQuestion.length !== correctAnswerCount) {
      setErrorMessage(
        `You must select exactly ${correctAnswerCount} answer${
          correctAnswerCount > 1 ? "s" : ""
        }.`
      );
    } else {
      setIsChecked(true);
      setErrorMessage(""); // Clear error message on valid selection
    }
  };

  const handleNextQuestion = () => {
    if (!isChecked) {
      handleCheckAnswer();
    } else {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setIsChecked(false);
      } else {
        handleSubmit();
      }
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setIsChecked(false);
    }
  };

  const handleSubmit = () => {
    setIsSubmitted(true);
    let correct = 0;
    const topicCorrect: Record<string, number> = {};
    const topicTotal: Record<string, number> = {};

    questions.forEach((question, index) => {
      const selected = answers[index] || [];
      const correctSet = new Set(question.answer);
      const selectedSet = new Set(selected);
      const isCorrect =
        selectedSet.size === correctSet.size &&
        [...selectedSet].every((a) => correctSet.has(a));

      if (isCorrect) correct++;

      // Grouping by topic (title)
      const topic = question.title;
      topicCorrect[topic] =
        topicCorrect[topic] + (isCorrect ? 1 : 0) || (isCorrect ? 1 : 0);
      topicTotal[topic] = topicTotal[topic] + 1 || 1;
    });

    setScore(correct);
    setScoreByTopic(topicCorrect);
    setTotalByTopic(topicTotal);
  };

  const handleReset = () => {
    setAnswers(Array(questions.length).fill([]));
    setIsChecked(false);
    setIsSubmitted(false);
    setScore(null);
    setCurrentQuestionIndex(0);
    setProgress(0);
    setErrorMessage("");
  };

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        {!isSubmitted && (
          <>
            <h1 className="text-3xl font-bold mb-8 text-center text-foreground">
              Question {currentQuestionIndex + 1}: {currentQuestion.title}
            </h1>
            <div className="text-center mb-4">
              {currentQuestion.type === "mc" && (
                <div>
                  Choose {currentQuestion.answer.length} answer
                  {currentQuestion.answer.length > 1 ? "s " : " "}
                  from the available options
                </div>
              )}
            </div>
          </>
        )}

        <div className="relative">
          {!isSubmitted && <Progress value={progress} className="h-1 mb-8" />}
          <div className="min-h-[400px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={isSubmitted ? "results" : currentQuestionIndex}
                initial={{ opacity: 1 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {!isSubmitted ? (
                  <div className="space-y-8">
                    <QuestionCard
                      question={currentQuestion}
                      selectedAnswers={answers[currentQuestionIndex]}
                      onSelectAnswer={handleSelectAnswer}
                      isChecked={isChecked}
                      correctAnswers={currentQuestion.answer}
                      isSubmitted={isSubmitted}
                      showAnswer={showAnswer} // Pass showAnswer prop
                    />
                    {errorMessage && (
                      <div className="text-red-600 text-center mt-4">
                        {errorMessage}
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-4">
                      <Button
                        onClick={handlePreviousQuestion}
                        disabled={
                          currentQuestionIndex === 0 ||
                          (isChecked && showAnswer)
                        }
                        variant="ghost"
                      >
                        <ChevronLeft className="mr-2 h-4 w-4" /> Previous
                      </Button>
                      <span className="text-sm font-medium">
                        {currentQuestionIndex + 1} / {questions.length}
                      </span>
                      <Button
                        onClick={handleNextQuestion}
                        disabled={answers[currentQuestionIndex].length === 0}
                        variant="ghost"
                      >
                        {isChecked
                          ? currentQuestionIndex === questions.length - 1
                            ? "Submit"
                            : "Next"
                          : "Check Answer"}
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <QuizScore
                      correctAnswers={score ?? 0}
                      totalQuestions={questions.length}
                      scoreByTopic={scoreByTopic}
                      totalByTopic={totalByTopic}
                    />
                    <div className="space-y-12">
                      <QuizReview questions={questions} userAnswers={answers} />
                    </div>
                    <div className="flex justify-center space-x-4 pt-4">
                      <Button onClick={handleReset} variant="secondary">
                        Restart
                      </Button>
                      <Button onClick={clearCSV}>Return to home page</Button>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
