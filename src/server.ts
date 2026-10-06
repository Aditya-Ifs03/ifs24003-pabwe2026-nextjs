import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import { resolve } from "node:path";

import next from "next";

/**
 * Server launcher aplikasi (TypeScript).
 *
 * Menjalankan Next.js secara programatik dan membaca port secara dinamis.
 *
 * Urutan pencarian port:
 *   1. `process.env.APP_PORT`
 *   2. `process.env.PORT`  (dipakai banyak platform hosting, termasuk Delcom)
 *   3. `APP_PORT` pada berkas `.env`
 *   4. `APP_PORT` pada berkas `.env.example`
 *   5. `3000` sebagai nilai cadangan
 *
 * Mode dijalankan hanya bila `NODE_ENV` bernilai `development`. Dengan begitu
 * perintah `bun run start` tetap berjalan dalam mode produksi walau
 * `NODE_ENV` tidak diset oleh platform hosting.
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
    process.env.PORT ||
    readPortFromEnvFile(".env") ||
    readPortFromEnvFile(".env.example");

  const parsed = Number.parseInt(raw ?? "", 10);
  return Number.isNaN(parsed) ? DEFAULT_PORT : parsed;
}

/** Menentukan apakah server berjalan dalam mode pengembangan. */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === "development";
}

async function main(): Promise<void> {
  const dev = isDevelopment();

  // Memuat `.env`, `.env.local`, dst. ke dalam `process.env` sebelum dibaca.
  const { loadEnvConfig } = await import("@next/env");
  loadEnvConfig(process.cwd(), dev);

  const port = resolvePort();
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