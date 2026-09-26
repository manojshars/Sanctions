import { expect, test } from "@playwright/test";
import { ADMIN, login, register, unique } from "./helpers";

test.beforeEach(async ({ context, baseURL }) => {
  await context.addCookies([{ name: "fca_consent", value: "necessary", url: baseURL! }]);
});

test("learners cannot access the admin portal", async ({ page }) => {
  await register(page, "Nosy Learner", unique("nosy"));
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/dashboard\?denied=1/);
});

test("admin: analytics, create and publish a question, import CSV", async ({ page }) => {
  await login(page, ADMIN.email, ADMIN.password, "/admin");
  await expect(page.getByRole("heading", { name: "Platform analytics" })).toBeVisible();
  await expect(page.getByText("Registered users")).toBeVisible();

  await page.goto("/admin/questions/new");
  const stem = `E2E question ${Date.now()}: which body administers US sanctions?`;
  await page.getByLabel("Question text").fill(stem);
  await page.getByLabel("Option 1 text").fill("FinCEN");
  await page.getByLabel("Option 2 text").fill("OFAC");
  await page.getByLabel("Option 3 text").fill("SEC");
  await page.getByLabel("Option 4 text").fill("FDIC");
  await page.getByLabel("Option 2 correct").check();
  await page.getByLabel("Explanation of the correct answer").fill("OFAC administers most US economic sanctions programmes.");
  await page.getByRole("button", { name: "Create draft" }).click();
  await expect(page.getByText("Changes saved.")).toBeVisible();
  await expect(page.getByText("Draft", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Publish" }).click();
  await expect(page.getByText("Published", { exact: true })).toBeVisible();

  await page.goto("/admin/questions/import");
  await page.getByLabel("…or paste CSV").fill(`topic,type,difficulty,stem,options,correct,explanation,access_tier\nsanctions,SINGLE,BEGINNER,"E2E import ${Date.now()}?","A|B",A,"A is the correct option here.",FREE\n`);
  await page.getByRole("button", { name: "Import" }).click();
  await expect(page.getByText(/1 created/)).toBeVisible();
});

test("admin: create a course with a module and lesson, then publish", async ({ page }) => {
  await login(page, ADMIN.email, ADMIN.password, "/admin/courses/new");
  const title = `E2E Course ${Date.now()}`;
  await page.getByLabel("Title", { exact: true }).fill(title);
  await page.getByLabel("Subtitle").fill("Created by the end-to-end test");
  await page.getByLabel("Overview").fill("An overview created by the automated end-to-end test.");
  await page.getByLabel("Learning objectives").fill("Understand the test");
  await page.getByRole("button", { name: "Create course" }).click();
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await page.getByLabel("New module title").fill("Module one");
  await page.getByRole("button", { name: "Add module" }).click();
  await page.getByRole("link", { name: "+ Add lesson" }).click();
  await page.waitForURL("**/lessons/new**");
  await expect(page.getByRole("heading", { name: "New lesson" })).toBeVisible();
  await page.getByLabel("Title", { exact: true }).fill("First lesson");
  await page.getByLabel("Content (Markdown)").fill("## Welcome\nThis is the first lesson.");
  await page.getByRole("button", { name: "Save lesson" }).click();
  await expect(page.getByText("Changes saved.")).toBeVisible();
  await page.getByRole("link", { name: new RegExp(title) }).click();
  await page.getByRole("button", { name: "Publish" }).click();
  await expect(page.getByText("Published", { exact: true })).toBeVisible();
});

test("support staff can reply to tickets", async ({ page, browser }) => {
  await register(page, "Needs Help", unique("help"));
  await page.goto("/support/new");
  await page.getByLabel("Subject").fill("Help with flashcards");
  await page.getByLabel("Describe the issue").fill("How does the spaced repetition schedule work?");
  await page.getByRole("button", { name: "Submit ticket" }).click();
  await page.waitForURL("**/support/tickets/**");
  const number = page.url().split("/").pop()!.split("?")[0];

  const staff = await browser.newContext();
  const sp = await staff.newPage();
  await login(sp, "support@demo.fincrime.academy", "DemoPass2026!", `/admin/support/${number}`);
  await sp.getByLabel("Reply or internal note").fill("Cards you find difficult come back sooner. See the help article on spaced repetition.");
  await sp.getByRole("button", { name: "Send" }).click();
  await expect(sp.getByText("Reply sent.")).toBeVisible();
  await staff.close();

  await page.reload();
  await expect(page.getByText(/Cards you find difficult come back sooner/)).toBeVisible();
  await expect(page.getByText("Awaiting your response")).toBeVisible();
});

test("admin: upload a PDF training material, download it from the library, then delete it", async ({ page }) => {
  const { PDFDocument } = await import("pdf-lib");
  const doc = await PDFDocument.create();
  doc.addPage().drawText("E2E training material");
  const buffer = Buffer.from(await doc.save());
  const title = `E2E material ${Date.now()}`;

  await login(page, ADMIN.email, ADMIN.password, "/admin/materials");
  await page.getByRole("link", { name: "Upload PDF" }).click();
  await page.locator("#file").setInputFiles({ name: "e2e-guide.pdf", mimeType: "application/pdf", buffer });
  await expect(page.getByText(/e2e-guide\.pdf · /)).toBeVisible();
  await page.getByLabel("Title").fill(title);
  await page.getByLabel("Description").fill("Uploaded by the end-to-end test.");
  await page.getByLabel("Topic (standalone items)").selectOption({ label: "Sanctions Compliance" });
  await page.getByLabel("Access").selectOption("FREE");
  await page.getByRole("button", { name: "Upload material" }).click();
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await expect(page.getByText("Changes saved.")).toBeVisible();
  await expect(page.getByText(/PDF · .* · 1 pages/)).toBeVisible();

  await page.goto("/resources");
  const card = page.locator("article", { hasText: title });
  await expect(card).toContainText("PDF");
  const [download] = await Promise.all([page.waitForEvent("download"), card.getByRole("link", { name: "Download" }).click()]);
  expect(download.suggestedFilename()).toBe("e2e-guide.pdf");

  await page.goto("/admin/materials");
  await page.getByRole("link", { name: title }).click();
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Delete material" }).click();
  await expect(page).toHaveURL(/\/admin\/materials\?saved=1/);
  await expect(page.getByRole("link", { name: title })).toHaveCount(0);
});

test("admin: non-PDF uploads are rejected", async ({ page }) => {
  await login(page, ADMIN.email, ADMIN.password, "/admin/materials/new");
  await page.locator("#file").setInputFiles({ name: "notes.pdf", mimeType: "application/pdf", buffer: Buffer.from("not really a pdf") });
  await page.getByLabel("Title").fill("Fake PDF");
  await page.getByLabel("Topic (standalone items)").selectOption({ label: "Sanctions Compliance" });
  await page.getByRole("button", { name: "Upload material" }).click();
  await expect(page.getByText("The file is not a valid PDF.")).toBeVisible();
});
