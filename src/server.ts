import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import { resolve } from "node:path";

import next from "next";

/**
 * Server launcher aplikasi (TypeScript).
 *
 * Menjalankan Next.js secara programatik dan membaca port secara dinamis dari
 * variabel lingkungan `APP_PORT`.
 *
 * Urutan pencarian port:
 *   1. `process.env.APP_PORT`  (diisi otomatis dari `.env` / `.env.local`)
 *   2. `APP_PORT` pada berkas `.env`
 *   3. `APP_PORT` pada berkas `.env.example`
 *   4. `3000` sebagai nilai cadangan
 */

const DEFAULT_PORT = 3000;

/** Membaca nilai `APP_PORT` langsung dari sebuah berkas env sederhana. */
export function readPortFromEnvFile(fileName: string): string | undefined {
  try {
    const contents = readFileSync(resolve(process.cwd(), fileName), "utf8");
    const line = contents
      .split(/\r?\n/)
      .find((row) => row.trim().startsWith("APP_PORT="));

    if (!line) {
      return undefined;
    }

    const value = line.slice(line.indexOf("=") + 1).trim();
    return value.length > 0 ? value : undefined;
  } catch {
    // Berkas tidak ada / tidak dapat dibaca: abaikan dan lanjut ke cadangan.
    return undefined;
  }
}

/** Menentukan port akhir yang dipakai server. */
export function resolvePort(): number {
  const raw =
    process.env.APP_PORT ||
    readPortFromEnvFile(".env") ||
    readPortFromEnvFile(".env.example");

  const parsed = Number.parseInt(raw ?? "", 10);
  return Number.isNaN(parsed) ? DEFAULT_PORT : parsed;
}

async function main(): Promise<void> {
  // Memuat `.env`, `.env.local`, dst. ke dalam `process.env` sebelum dibaca.
  const { loadEnvConfig } = await import("@next/env");
  loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");

  const port = resolvePort();
  const dev = process.env.NODE_ENV !== "production";
  const app = next({ dev, port });
  const handle = app.getRequestHandler();

  await app.prepare();

  createServer((req, res) => {
    void handle(req, res);
  }).listen(port, () => {
    console.log(
      `> Server ${dev ? "development" : "production"} siap di http://localhost:${port}`,
    );
  });
}

// Hanya jalankan server bila berkas ini dieksekusi langsung (bukan di-import).
if (process.env.NODE_ENV !== "test") {
  void main();
}
