import { defineConfig } from "vitest/config";
import path from "path";

const TEST_DB = process.env.TEST_DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/fincrime_test?schema=public";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "server-only": path.resolve(__dirname, "tests/setup/empty.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts", "tests/integration/**/*.test.ts"],
    globalSetup: ["tests/setup/global-setup.ts"],
    env: { DATABASE_URL: TEST_DB, AUTH_SECRET: "test-secret-for-vitest-only-0123456789", EMAIL_PROVIDER: "log", STRIPE_SECRET_KEY: "", NODE_ENV: "test", APP_URL: "http://localhost:3000" },
    testTimeout: 30_000,
    hookTimeout: 180_000,
    fileParallelism: false,
  },
});
