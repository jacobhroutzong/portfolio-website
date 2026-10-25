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
export const knowledgeSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  domain: z.enum([
    "Architecture",
    "Inference",
    "Training",
    "Post-training",
    "Evaluation",
    "Applied systems",
  ]),
  track: z.number().int().min(0).max(12),
  title: z.string().min(10),
  summary: z.string().min(20),
  explanation: z.string().min(100),
  equation: z.string(),
  example: z.string().min(50),
  pitfalls: z.array(z.string()).min(3),
  related: z.array(z.string()).min(1),
  problem: z.string(),
  exercise_role: z
    .enum(["application", "prerequisite"])
    .default("prerequisite"),
  prerequisites: z.array(z.string()).default([]),
  level: z.enum(["Intermediate", "Advanced"]),
  last_verified: z.iso.date(),
  sources: z.array(z.object({ title: z.string(), url: z.url() })).min(1),
  question: z.object({
    id: z.string(),
    prompt: z.string(),
    answer: z.string().min(100),
    followups: z.array(z.string()).min(2),
    rubric: z.array(z.string()).min(4),
  }),
});
export type Knowledge = z.infer<typeof knowledgeSchema>;
export const studyPathSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string(),
  goal: z.string(),
  ids: z.array(z.string()).min(1),
  capstone: z.object({
    title: z.string(),
    project: z.string(),
    environment: z.string(),
    steps: z.array(z.string()).min(3),
    acceptance: z.array(z.string()).min(3),
  }),
});
export type StudyPath = z.infer<typeof studyPathSchema>;
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
