import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import type { Lesson } from "../../src/lib/ascent/schema";
test.beforeEach(async ({ page }) => {
  page.on("pageerror", (error) => {
    throw error;
  });
});
test("workspace, filters, local persistence and responsive layout", async ({
  page,
}) => {
  await page.goto("/ascent/");
  await expect(
    page.getByRole("heading", { name: "Your next step starts here." }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `artifacts/ascent-${test.info().project.name}.png`,
    fullPage: true,
  });
  await page.getByRole("link", { name: "Practice", exact: true }).click();
  await page.getByLabel("Topic", { exact: true }).selectOption("Attention");
  await expect(
    page.getByRole("status").filter({ hasText: "4 problems" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Your progress", exact: true }).click();
  await page.getByLabel("XP per day").fill("100");
  await page.getByRole("button", { name: "Save intention" }).click();
  await expect(
    page.getByText("Intention saved.", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("XP per day")).toHaveValue("100");
});
test("submit Python, keep hidden checks lazy, and stop an infinite loop", async ({
  page,
}, info) => {
  test.skip(
    info.project.name === "mobile",
    "Code execution intentionally requires desktop.",
  );
  let hiddenRequests = 0;
  page.on("request", (request) => {
    if (request.url().includes("/ascent/checks/")) hiddenRequests++;
  });
  await page.goto("/ascent/#problem/first-repeat");
  await page.getByRole("button", { name: "Plain editor", exact: true }).click();
  await expect(page.locator("#code-fallback")).toBeVisible();
  expect(hiddenRequests).toBe(0);
  await page
    .locator("#code-fallback")
    .fill(
      "def solve(xs):\n    seen=set()\n    for x in xs:\n        if x in seen: return x\n        seen.add(x)\n    return None",
    );
  await page.getByRole("button", { name: "Run tests", exact: false }).click();
  await expect(
    page.getByRole("heading", { name: "All tests passed", exact: true }),
  ).toBeVisible({ timeout: 100000 });
  expect(hiddenRequests).toBe(0);
  await page.getByRole("button", { name: "Submit", exact: false }).click();
  await expect(page.locator("#results")).toContainText("11/11 checks", {
    timeout: 100000,
  });
  expect(hiddenRequests).toBe(1);
  await page.locator("#code-fallback").fill("while True:\n    pass");
  await page.getByRole("button", { name: "Run tests", exact: false }).click();
  await expect(page.locator("#console")).toContainText("Time limit exceeded", {
    timeout: 100000,
  });
  await page.reload();
  await page.getByRole("button", { name: "Plain editor", exact: true }).click();
  await expect(page.locator("#code-fallback")).toHaveValue(
    "while True:\n    pass",
  );
});
test("complete a lesson, pass a boss, and round-trip an export", async ({
  page,
}, info) => {
  test.skip(
    info.project.name === "mobile",
    "Python exercise is verified in the desktop lesson flow.",
  );
  await page.goto("/ascent/#lesson/python-values");
  await page.getByRole("button", { name: "Let’s begin" }).click();
  const check = () =>
    page.getByRole("button", { name: "Check answer", exact: true }).click();
  const next = () =>
    page.getByRole("button", { name: "Continue", exact: false }).click();
  await page.getByRole("button", { name: "[0, 1, 2]", exact: true }).click();
  await check();
  await next();
  await page.getByRole("button", { name: "0", exact: true }).click();
  await page.getByRole("button", { name: "[]", exact: true }).click();
  await check();
  await next();
  await page.getByLabel("Python answer").fill("def square(x):\n    return x*x");
  await check();
  await expect(page.getByText("That’s right.", { exact: true })).toBeVisible({
    timeout: 100000,
  });
  await next();
  await page.getByRole("button", { name: "[1, 2]", exact: true }).click();
  await check();
  await next();
  await page.locator("#answer").fill("6");
  await check();
  await next();
  await page
    .getByLabel("Your explanation")
    .fill(
      "Two names can refer to one mutable list. A shallow copy creates a new outer list but still shares nested objects.",
    );
  await page.getByRole("button", { name: "Compare with rubric" }).click();
  await page.getByRole("button", { name: "Meets the rubric" }).click();
  await next();
  await expect(
    page.getByRole("heading", { name: "One step further.", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Your progress", exact: true }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export progress JSON" }).click();
  const file = await (await download).path();
  const data = JSON.parse(await readFile(file!, "utf8"));
  expect(data.completed).toContain("python-values");
  // Put the learner at a completed-unit checkpoint via the same validated import used for real backups.
  const all: Lesson[] = JSON.parse(
    await readFile(
      new URL("../../content/tracks/lessons.yaml", import.meta.url),
      "utf8",
    ),
  );
  data.completed = all
    .filter((l: { track: number }) => l.track === 0)
    .map((l: { id: string }) => l.id);
  data.skills["0"] = {
    level: 1,
    successes: 10,
    last: "2026-10-24",
    dates: ["2026-10-24"],
  };
  await page.locator("#import").setInputFiles({
    name: "progress.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(data)),
  });
  await expect(
    page.getByText("Progress imported.", { exact: true }),
  ).toBeVisible();
  await page.goto("/ascent/#boss/0");
  const questions = all
    .filter((l: { track: number }) => l.track === 0)
    .flatMap((l) => l.exercises)
    .filter(
      (e: { type: string }) =>
        !["free", "fill", "coding", "multipart"].includes(e.type),
    )
    .slice(-3);
  for (const e of questions) {
    if (e.type === "multi") {
      for (const value of Array.isArray(e.answer)
        ? e.answer
        : [String(e.answer)])
        await page.getByRole("button", { name: value, exact: true }).click();
    } else if (e.type === "ordering") {
      for (const value of Array.isArray(e.answer)
        ? e.answer
        : [String(e.answer)])
        await page.getByRole("button", { name: value, exact: true }).click();
    } else
      await page
        .getByRole("button", { name: String(e.answer), exact: true })
        .click();
    if (e.code)
      await page.getByLabel("Corrected Python code").fill(e.reference!);
    await check();
    await expect(page.getByText("That’s right.", { exact: true })).toBeVisible({
      timeout: 100000,
    });
    await next();
  }
  await expect(
    page.getByRole("heading", {
      name: "A foundation worth building on.",
      exact: true,
    }),
  ).toBeVisible();
});
test("lesson attempt reveals actionable feedback", async ({ page }) => {
  await page.goto("/ascent/#lesson/python-values");
  await page.getByRole("button", { name: "Let’s begin" }).click();
  await page.getByRole("button", { name: "[0, 1, 2]", exact: true }).click();
  await page.getByRole("button", { name: "Check answer", exact: true }).click();
  await expect(page.getByText("That’s right.", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Continue", exact: false }).click();
  await expect(
    page.getByRole("heading", {
      name: "Which values are false in a condition?",
    }),
  ).toBeVisible();
});
