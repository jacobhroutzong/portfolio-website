import { test, expect } from "@playwright/test";

test("selected advanced path persists and drives readiness without a beginner gate", async ({
  page,
}) => {
  await page.goto("/ascent/#paths");
  const path = page
    .locator("article")
    .filter({
      has: page.getByRole("heading", {
        name: "Evidence-driven AI systems",
        exact: true,
      }),
    });
  await path.getByRole("button", { name: "Use this study path" }).click();
  await expect(
    path.getByRole("button", { name: "Your active study path" }),
  ).toBeDisabled();
  await expect(
    path.getByText("A recoverable, evaluated tool workflow", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    path.getByRole("button", { name: "Your active study path" }),
  ).toBeDisabled();
  await page.getByRole("link", { name: "Readiness", exact: true }).click();
  const next = page
    .locator("article")
    .filter({
      has: page.getByRole("heading", { name: "Three next steps", exact: true }),
    });
  await expect(next).toContainText("Evidence-driven AI systems");
  await expect(next).toContainText(
    "Benchmark scores, contamination and task validity",
  );
  await expect(next).not.toContainText("Find a lesson");
});

test("concepts distinguish application tests from prerequisite drills", async ({
  page,
}) => {
  await page.goto("/ascent/#concept/sft-data");
  await expect(
    page.getByRole("link", { name: "Open application exercise", exact: false }),
  ).toHaveAttribute("href", "#problem/assistant-labels");
  await expect(
    page.getByText("Application code: no independent passing submission", {
      exact: true,
    }),
  ).toBeVisible();
  await page.goto("/ascent/#concept/agent-permissions");
  await expect(
    page.getByRole("link", { name: "Open prerequisite drill", exact: false }),
  ).toHaveAttribute("href", "#problem/idempotency-ledger");
  await expect(
    page.getByText("Application code: linked drill is a prerequisite", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Before this concept", exact: true }),
  ).toBeVisible();
});
