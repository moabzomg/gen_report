import { z } from "zod";
// Schema for individual question
export const questionSchema = z.object({
  title: z.string(), // Quiz title
  question: z.string(), // The question in HTML format
  options: z.array(z.string()),
  answer: z.array(z.string()),
  explanation: z.string(), // Explanation in HTML format
  type: z.string(), // Question type
});

// Type for individual question
export type Question = z.infer<typeof questionSchema>;

// Schema for the entire quiz (array of questions)
export const questionsSchema = z.array(questionSchema);

