import lessonsRaw from "../../../content/tracks/lessons.yaml?raw";
import problemsRaw from "../../../content/problems/library.yaml?raw";
import tracksRaw from "../../../content/skills.yaml?raw";
import labsRaw from "../../../content/labs/profiles.yaml?raw";
import { parse } from "yaml";
import { lessonSchema, problemSchema, type Track } from "./schema";
export const lessons = lessonSchema.array().parse(parse(lessonsRaw));
export const problems = problemSchema.array().parse(parse(problemsRaw));
export const tracks = parse(tracksRaw) as Track[];
export const labs = parse(labsRaw) as {
  name: string;
  weights: number[];
  source: string;
  last_verified: string | null;
  note: string;
}[];
