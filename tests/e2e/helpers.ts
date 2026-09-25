import type { Page } from "@playwright/test";

export const ADMIN = { email: "admin@fincrime.academy", password: "ChangeMe!Admin2026" };
export const DEMO_PW = "DemoPass2026!";

export async function acceptCookies(page: Page) {
  await page.context().addCookies([{ name: "fca_consent", value: "necessary", url: page.url().startsWith("http") ? page.url() : "http://localhost:3100" }]);
}

export async function login(page: Page, email: string, password: string, next = "/dashboard") {
  await page.goto(`/login?next=${encodeURIComponent(next)}`);
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"));
}

export async function register(page: Page, name: string, email: string, password = "Password123!") {
  await page.goto("/register");
  await page.getByLabel("Full name").fill(name);
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByLabel("Sanctions Compliance").check();
  await page.getByLabel(/I agree to the/).check();
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL("**/dashboard**");
}

export const unique = (p: string) => `${p}-${Date.now()}-${Math.floor(Math.random() * 1e4)}@example.test`;
