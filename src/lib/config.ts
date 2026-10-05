/**
 * Modul konfigurasi terpusat.
 *
 * Semua konstanta lingkungan aplikasi dikumpulkan di sini supaya tidak ada
 * nilai `process.env` yang tersebar dan di-hardcode di banyak berkas.
 */

/** Nilai bawaan bila `NEXT_PUBLIC_DELCOM_BASEURL` tidak didefinisikan. */
export const DEFAULT_DELCOM_BASEURL = "https://open-api.delcom.org/api/v1";

/** Nilai bawaan bila `APP_PORT` tidak didefinisikan. */
export const DEFAULT_APP_PORT = "3000";

/**
 * Base URL REST API Delcom.
 *
 * Dipakai oleh seluruh modul `*Api.ts` melalui `apiHelper`.
 */
export const DELCOM_BASEURL: string =
  process.env.NEXT_PUBLIC_DELCOM_BASEURL || DEFAULT_DELCOM_BASEURL;

/**
 * Port aplikasi.
 *
 * Dibaca oleh `src/server.ts` untuk menjalankan server launcher.
 */
export const APP_PORT: string = process.env.APP_PORT || DEFAULT_APP_PORT;
