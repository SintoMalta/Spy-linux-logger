import { defineConfig } from "vitest/config";
import path from "path";
import { loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    test: {
      environment: "node",
      include: ["src/**/*.test.ts", "src/**/__tests__/**/*.ts"],
      env: {
        ...env,
        DATABASE_URL:
          env.DATABASE_URL ??
          "postgresql://coop:coop@localhost:5432/coop_launch?schema=public",
        SESSION_SECRET: env.SESSION_SECRET ?? "test-session-secret-32chars-min!!",
      },
      fileParallelism: false,
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
