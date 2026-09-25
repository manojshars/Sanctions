import { expect, test } from "@playwright/test";

test("mobile navigation drawer works and pages do not scroll horizontally", async ({ page, context, baseURL }) => {
  await context.addCookies([{ name: "fca_consent", value: "necessary", url: baseURL! }]);
  for (const p of ["/", "/academy", "/academy/courses", "/academy/courses/aml-cft-fundamentals", "/question-bank", "/question-bank/browse", "/mock-exams", "/mock-exams/readiness", "/flashcards", "/videos", "/case-studies", "/case-studies/harbourline-logistics-ownership", "/knowledge", "/knowledge/glossary", "/knowledge/regulations", "/knowledge/typologies", "/pricing", "/support", "/corporate", "/about", "/search?q=aml", "/login", "/register"]) {
    await page.goto(p);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `horizontal overflow on ${p}`).toBeLessThanOrEqual(1);
  }
  await page.goto("/");
  await page.locator("html[data-hydrated]").waitFor({ state: "attached" });
  await page.getByRole("button", { name: "Open menu" }).click();
  const drawer = page.getByRole("dialog", { name: "Menu" });
  await expect(drawer).toBeVisible();
  await drawer.getByRole("link", { name: "Flashcards" }).click();
  await expect(page).toHaveURL(/\/flashcards$/);
});
