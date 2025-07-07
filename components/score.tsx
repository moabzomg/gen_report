import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface QuizScoreProps {
  correctAnswers: number;
  totalQuestions: number;
  scoreByTopic?: Record<string, number>;
  totalByTopic?: Record<string, number>;
}

export default function QuizScore({
  correctAnswers,
  totalQuestions,
  scoreByTopic,
  totalByTopic,
}: QuizScoreProps) {
  const score = (correctAnswers / totalQuestions) * 100;
  const roundedScore = Math.round(score);

  const getMessage = () => {
    if (roundedScore === 100) return "Perfect score! Congratulations!";
    if (roundedScore >= 80) return "Great job! You did excellently!";
    if (roundedScore >= 60) return "Good effort! You're on the right track.";
    if (roundedScore >= 40) return "Not bad, but there's room for improvement.";
    return "Keep practicing, you'll get better!";
  };

  return (
    <Card className="w-full">
      <CardContent className="space-y-6 p-8">
        <div className="text-center">
          <p className="text-4xl font-bold">{roundedScore}%</p>
          <p className="text-sm text-muted-foreground">
            {correctAnswers} out of {totalQuestions} correct
          </p>
        </div>
        <p className="text-center font-medium">{getMessage()}</p>

        {/* 👇 Topic breakdown */}
        {scoreByTopic && totalByTopic && (
          <div className="space-y-4 mt-6">
            <h3 className="text-lg font-semibold">Score by Topic</h3>
            <ul className="space-y-2">
              {Object.entries(scoreByTopic).map(([topic, score]) => {
                const total = totalByTopic[topic] || 0;
                const percent = total ? Math.round((score / total) * 100) : 0;
                return (
                  <li key={topic} className="flex justify-between items-center">
                    <span>{topic}</span>
                    <span className="font-medium">
                      {score}/{total} ({percent}%)
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
