import { test, expect } from "@playwright/test";
test("search, explain, assess, bookmark and restore an advanced concept", async ({
  page,
}) => {
  await page.goto("/ascent/#knowledge");
  await page
    .getByRole("searchbox", { name: "Search knowledge", exact: true })
    .fill("grouped");
  await expect(page.locator("#knowledge-count")).toHaveText("1 references");
  await page
    .getByRole("link", { name: /Grouped-query attention and cache pressure/ })
    .click();
  await expect(
    page.getByRole("heading", { name: "A worked example", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Reveal recall checklist", exact: false })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "Write a substantive attempt" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Save reference", exact: false })
    .click();
  await expect(
    page.getByRole("button", { name: "◇ Saved", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("textbox", { name: "Your technical explanation", exact: true })
    .fill(
      "Grouped-query attention shares key and value heads across query heads. It reduces cache memory; compare output quality and bandwidth under the same serving workload, and verify the shape mapping.",
    );
  await page
    .getByRole("button", { name: "Reveal recall checklist", exact: false })
    .click();
  await page
    .getByLabel("Your evidence-based self-assessment")
    .selectOption("4");
  await page
    .getByRole("button", { name: "Record & schedule review", exact: true })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "Review scheduled" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("✓ Previously retrieved or assessed", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("textbox", {
      name: "Your technical explanation",
      exact: true,
    }),
  ).toContainText("Grouped-query attention");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("interview answer stays hidden until an attempt and study paths link real content", async ({
  page,
}) => {
  await page.goto("/ascent/#question/q-kv-cache");
  await expect(
    page.getByRole("heading", { name: "One strong answer", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("textbox", { name: "Your technical explanation", exact: true })
    .fill(
      "I would specify append, read, reset, capacity and ownership. Test equivalence against a full-prefix forward pass before eviction, isolate sequence state, and verify nonzero position offsets.",
    );
  await page
    .getByRole("button", { name: "Reveal answer and rubric", exact: false })
    .click();
  await expect(
    page.getByRole("heading", { name: "Interviewer follow-ups", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Study paths", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "Inference systems interview",
      exact: true,
    }),
  ).toBeVisible();
});
