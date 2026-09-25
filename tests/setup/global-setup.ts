import { execSync } from "child_process";

/**
 * Prepares the dedicated test database without destroying data: applies pending migrations
 * (`prisma migrate deploy`) and runs the idempotent seed. Tests create uniquely-named records,
 * so they do not depend on a clean database. To start from scratch, reset the *test* database
 * yourself (e.g. `DATABASE_URL=<test url> npx prisma migrate reset`).
 */
export default function setup() {
  const url = process.env.TEST_DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/fincrime_test?schema=public";
  if (!/test/i.test(new URL(url).pathname)) throw new Error("Refusing to use a database whose name does not contain 'test'.");
  if (process.env.SKIP_DB_SETUP === "1") return;
  const env = { ...process.env, DATABASE_URL: url, SEED_DEMO_USERS: "true" };
  execSync("npx prisma migrate deploy", { stdio: "inherit", env });
  execSync("npx tsx prisma/seed.ts", { stdio: "inherit", env });
}
