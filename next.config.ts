import type { NextConfig } from "next";

/**
 * Konfigurasi Next.js.
 *
 * Catatan penting untuk Next.js 16:
 * - Turbopack **sudah aktif secara bawaan** untuk `next dev` maupun
 *   `next build`, sehingga opsi `--turbopack` pada script tidak lagi
 *   diperlukan. Blok `turbopack` di bawah ini dipakai untuk menegaskan
 *   (dan suatu saat menyetel) konfigurasi Turbopack.
 * - `experimental.turbopack` (gaya Next.js 15) sudah dipindahkan ke
 *   opsi tingkat atas `turbopack`.
 */
const nextConfig: NextConfig = {
  // Turbopack aktif secara bawaan; blok ini menjadi tempat setelan Turbopack.
  turbopack: {},

  // Optimasi bawaan Next.js.
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,

  experimental: {
    // Hanya memuat modul ikon yang benar-benar dipakai sehingga bundel kecil.
    optimizePackageImports: ["react-icons"],
    // Memakai TypeScript JavaScript compiler API (in-process) alih-alih
    // menjalankan proses `tsc` terpisah. Pemeriksaan tipe tetap dijalankan dan
    // tetap menggagalkan build bila ada galat. Proyek ini memakai TypeScript 5,
    // sehingga compiler API tersedia.
    useTypeScriptCli: false,
    // Menjalankan worker Next.js (pemeriksaan tipe & static generation) sebagai
    // thread, bukan proses terpisah: lebih hemat memori dan tetap bekerja pada
    // lingkungan yang membatasi pembuatan child process.
    workerThreads: true,
  },

  images: {
    // Cover postingan & foto profil berasal dari host dinamis milik API
    // Delcom (termasuk `http://127.0.0.1:8000` saat pengembangan), sehingga
    // optimizer gambar dimatikan agar berkas apa pun dapat ditampilkan.
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
};

export default nextConfig;
