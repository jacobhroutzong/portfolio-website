import { z } from "zod";
export const kinds = [
  "choice",
  "multi",
  "ordering",
  "fill",
  "shape",
  "bug",
  "math",
  "estimation",
  "coding",
  "multipart",
  "free",
] as const;
export const exerciseSchema = z.object({
  id: z.string(),
  type: z.enum(kinds),
  prompt: z.string(),
  options: z.array(z.string()).optional(),
  answer: z.union([z.string(), z.array(z.string()), z.number()]),
  explanation: z.string(),
  tolerance: z.number().optional(),
  code: z.string().optional(),
  tests: z.string().optional(),
  rubric: z.array(z.string()).optional(),
  reference: z.string().optional(),
  stages: z
    .array(z.object({ prompt: z.string(), tests: z.array(z.string()) }))
    .optional(),
});
export const lessonSchema = z.object({
  id: z.string(),
  track: z.number().int(),
  title: z.string(),
  objective: z.string(),
  prerequisites: z.array(z.string()),
  concept: z
    .string()
    .refine(
      (s) => s.split(/\s+/).length < 150,
      "Concept must be under 150 words",
    ),
  equation: z.string().optional(),
  recap: z.string(),
  source: z.url(),
  exercises: z.array(exerciseSchema).min(6).max(12),
});
export const problemSchema = z.object({
  id: z.string(),
  title: z.string(),
  track: z.number().int(),
  topic: z.string(),
  difficulty: z.number().min(1).max(5),
  labs: z.array(z.string()),
  minutes: z.number(),
  statement: z.string(),
  constraints: z.string(),
  examples: z.array(z.string()).min(3),
  starter: z.string(),
  signature: z.string(),
  visible: z.array(z.string()).min(3),
  hints: z.array(z.string()).length(3),
  editorial: z.string(),
  mistakes: z.array(z.string()),
  complexity: z.string(),
  prerequisites: z.array(z.string()),
  shape: z.string().optional(),
  stability: z.string().optional(),
  production: z.string().optional(),
});
export type Exercise = z.infer<typeof exerciseSchema>;
export type Lesson = z.infer<typeof lessonSchema>;
export type Problem = z.infer<typeof problemSchema>;
export type Track = {
  id: number;
  title: string;
  description: string;
  units: string[];
  capstone: string;
  prerequisites: number[];
};
