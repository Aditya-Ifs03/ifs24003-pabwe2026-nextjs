import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Resolusi alias `@/*` mengikuti `paths` pada tsconfig.json.
    // (Vite 8 sudah mendukung ini secara bawaan.)
    tsconfigPaths: true,
  },
  test: {
    environment: "jsdom",
    globals: true,
    // Worker berbasis thread lebih ringan dan tidak memerlukan proses terpisah.
    pool: "threads",
    setupFiles: ["./src/setupTests.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    css: false,
    // Timeout bawaan (5 detik) terlalu ketat untuk pengujian interaksi yang
    // memakai @testing-library/user-event. Pada mesin yang sedang sibuk atau di
    // dalam container CI (mis. container Docker Jenkins) yang masih dingin,
    // pengujian yang sebenarnya lulus bisa gagal hanya karena waktu habis.
    testTimeout: 30000,
    hookTimeout: 30000,
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary", "html", "lcov", "json"],
      reportsDirectory: "./coverage",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        // Berkas pengujian & konfigurasi pengujian.
        "src/**/*.{test,spec}.{ts,tsx}",
        "src/setupTests.ts",
        "src/test-utils.tsx",
        "src/navigation-mock.ts",
        // Berkas deklarasi tipe (tanpa kode runtime).
        "src/**/*.d.ts",
        "src/types/**",
        // Route App Router hanya pembungkus tipis (<Page /> / <Layout />).
        "src/app/**",
        // Server launcher dijalankan di luar proses pengujian.
        "src/server.ts",
      ],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
    },
  },
});