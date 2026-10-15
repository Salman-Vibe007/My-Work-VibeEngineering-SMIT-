import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // tsconfig uses jsx: "preserve" (Next.js) — tests need automatic JSX.
  esbuild: {
    jsx: "automatic",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    css: false,
    include: ["src/**/__tests__/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["src/lib/**", "src/store/**", "src/components/**"],
    },
  },
});
