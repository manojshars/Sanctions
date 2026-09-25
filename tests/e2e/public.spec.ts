import { expect, test } from "@playwright/test";

test.beforeEach(async ({ context, baseURL }) => {
  await context.addCookies([{ name: "fca_consent", value: "necessary", url: baseURL! }]);
});

const PUBLIC = ["/", "/academy", "/academy/courses", "/question-bank", "/question-bank/browse", "/mock-exams", "/mock-exams/readiness", "/flashcards", "/flashcards/daily", "/videos", "/case-studies", "/case-studies/harbourline-logistics-ownership", "/knowledge", "/knowledge/glossary", "/knowledge/regulations", "/knowledge/typologies", "/resources", "/support", "/pricing", "/pricing/packages", "/corporate", "/about", "/contact", "/privacy", "/terms", "/certificates/verify", "/login", "/register", "/search?q=beneficial"];

for (const path of PUBLIC) {
  test(`public page renders: ${path}`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const res = await page.goto(path);
    expect(res?.status()).toBe(200);
    await expect(page.locator("main")).toBeVisible();
    await expect(page.locator("h1").first()).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test("header navigation links resolve", async ({ page, request }) => {
  await page.goto("/");
  const hrefs = await page.locator("header a[href^='/'], footer a[href^='/']").evaluateAll((els) => [...new Set(els.map((e) => (e as HTMLAnchorElement).getAttribute("href")!))]);
  for (const href of hrefs) {
    const r = await request.get(href, { maxRedirects: 0 });
    expect([200, 307, 308], `${href} -> ${r.status()}`).toContain(r.status());
  }
});

test("private pages redirect signed-out users to login and are noindex", async ({ request }) => {
  for (const p of ["/dashboard", "/admin", "/settings", "/my-learning"]) {
    const r = await request.get(p, { maxRedirects: 0 });
    expect(r.status()).toBe(307);
    expect(r.headers()["location"]).toContain("/login?next=");
  }
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain("Disallow: /admin");
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("/academy/courses/aml-cft-fundamentals");
});

test("global search returns grouped results and suggestions", async ({ page }) => {
  await page.goto("/search?q=beneficial");
  await expect(page.getByRole("heading", { name: "Glossary" })).toBeVisible();
  await page.getByLabel("Search FinCrime Academy").fill("sanction");
  await expect(page.getByRole("listbox")).toBeVisible();
});

test("certificate verification shows not found for unknown codes", async ({ page }) => {
  await page.goto("/certificates/verify");
  await page.getByLabel("Verification code").fill("ZZZZ-ZZZZ-ZZZZ");
  await page.getByRole("button", { name: "Verify" }).click();
  await expect(page.getByText("No certificate found")).toBeVisible();
});

test("theme toggle switches to dark mode", async ({ page }) => {
  await page.goto("/");
  await page.locator("html[data-hydrated]").waitFor({ state: "attached" });
  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
});
