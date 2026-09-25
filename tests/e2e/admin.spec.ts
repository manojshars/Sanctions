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
