import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { register, unique, login, DEMO_PW } from "./helpers";

/** Answers whatever question type is on screen (choice, text or matching). */
async function answerCurrent(page: Page) {
  const option = page.locator("fieldset label");
  if (await option.count()) return option.first().click();
  if (await page.locator("#fb-input").count()) return page.locator("#fb-input").fill("placement");
  if (await page.locator("#sa-input").count()) return page.locator("#sa-input").fill("a short answer");
  const selects = page.locator("select[id^='m-']");
  for (let i = 0; i < (await selects.count()); i++) await selects.nth(i).selectOption({ index: 1 });
}

test.beforeEach(async ({ context, baseURL }) => {
  await context.addCookies([{ name: "fca_consent", value: "necessary", url: baseURL! }]);
});

test("register, enrol, complete a lesson and resume progress", async ({ page }) => {
  await register(page, "E2E Learner", unique("learner"));
  await expect(page.getByRole("heading", { name: /Welcome back, E2E/ })).toBeVisible();
  await page.goto("/academy/courses/aml-cft-fundamentals");
  await page.getByRole("button", { name: "Enrol in this course" }).click();
  await page.waitForURL("**/lessons/what-is-money-laundering");
  await expect(page.getByRole("heading", { level: 1, name: "What is money laundering?" })).toBeVisible();
  await page.getByRole("button", { name: /Mark complete & continue/ }).click();
  await page.waitForURL("**/lessons/terrorist-financing-and-how-it-differs");
  await page.goto("/dashboard");
  await expect(page.getByText("AML/CFT Fundamentals").first()).toBeVisible();
  await expect(page.getByText(/1\/6 lessons/)).toBeVisible();
  await page.getByRole("link", { name: "Resume" }).first().click();
  await expect(page).toHaveURL(/terrorist-financing-and-how-it-differs/);
});

test("practice session: check an answer, finish and review results", async ({ page }) => {
  await register(page, "Practice Learner", unique("practice"));
  await page.goto("/question-bank");
  await page.getByText("Quick", { exact: true }).click();
  await page.getByRole("button", { name: "Start practice" }).click();
  await page.waitForURL("**/question-bank/session/**");
  await expect(page.getByText("Question 1 of 5")).toBeVisible();
  await answerCurrent(page);
  await page.getByRole("button", { name: "Check answer" }).click();
  await expect(page.getByText(/Explanation:/)).toBeVisible();
  await page.getByRole("button", { name: /^Finish$/ }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Submit" }).click();
  await page.waitForURL("**/results");
  await expect(page.getByRole("heading", { name: "Topic-wise accuracy" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Answer review" })).toBeVisible();
});

test("timed mock exam: answers are hidden until submission", async ({ page }) => {
  await register(page, "Exam Learner", unique("exam"));
  await page.goto("/mock-exams");
  await page.getByRole("button", { name: /Start examination/ }).first().click();
  await page.waitForURL("**/mock-exams/exam/**");
  await expect(page.getByRole("timer")).toBeVisible();
  await expect(page.getByRole("button", { name: "Check answer" })).toHaveCount(0);
  await answerCurrent(page);
  await expect(page.getByText("Answer saved")).toBeVisible();
  await page.getByRole("button", { name: "Mark for review", exact: true }).click();
  await expect(page.getByRole("button", { name: "Marked for review", exact: true })).toBeVisible();
  await page.getByRole("button", { name: /^Submit$/ }).first().click();
  await page.getByRole("dialog").getByRole("button", { name: "Submit" }).click();
  await page.waitForURL("**/results");
  await expect(page.getByText(/of 20 correct/)).toBeVisible();
});

test("flashcards: flip, rate and receive revision scheduling", async ({ page }) => {
  await register(page, "Card Learner", unique("cards"));
  await page.goto("/flashcards/aml-terminology");
  await page.getByRole("button", { name: "Reveal answer" }).click();
  await page.getByRole("button", { name: /Medium/ }).click();
  await expect(page.getByText(/Scheduled — next review tomorrow/)).toBeVisible();
  await page.goto("/flashcards");
  await expect(page.getByText("Upcoming (7 days)")).toBeVisible();
});

test("support: create a ticket and track it", async ({ page }) => {
  await register(page, "Ticket Learner", unique("ticket"));
  await page.goto("/support/new");
  await page.getByLabel("Subject").fill("Cannot find my certificate");
  await page.getByLabel("Describe the issue").fill("I completed a course but cannot see the certificate on my dashboard.");
  await page.getByRole("button", { name: "Submit ticket" }).click();
  await page.waitForURL("**/support/tickets/**");
  await expect(page.getByText("Your ticket has been created")).toBeVisible();
  await expect(page.getByText("Open", { exact: true })).toBeVisible();
  await page.goto("/support/tickets");
  await expect(page.getByText("Cannot find my certificate")).toBeVisible();
});

test("premium content is gated for free learners and open for premium members", async ({ page }) => {
  await register(page, "Free Learner", unique("free"));
  await page.goto("/academy/courses/ofac-50-percent-rule-ownership");
  await expect(page.getByText("Premium course")).toBeVisible();
  await expect(page.getByRole("button", { name: "Enrol in this course" })).toHaveCount(0);
  await page.context().clearCookies();
  await login(page, "premium@demo.fincrime.academy", DEMO_PW, "/academy/courses/ofac-50-percent-rule-ownership");
  await expect(page.getByRole("button", { name: /Enrol in this course/ }).or(page.getByRole("link", { name: /Continue learning|Start first lesson/ }))).toBeVisible();
});
