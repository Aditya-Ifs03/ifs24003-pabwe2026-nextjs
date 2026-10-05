import Swal from "sweetalert2";

import { DELCOM_BASEURL } from "@/lib/config";

/**
 * Utilitas dialog notifikasi interaktif berbasis SweetAlert2 serta helper
 * pemformatan tanggal/waktu.
 */

/** Warna tombol konfirmasi agar seragam dengan tema aplikasi. */
const CONFIRM_BUTTON_COLOR = "#0d9488";

/** Konfigurasi dasar yang dipakai seluruh dialog. */
const baseDialog = {
  confirmButtonColor: CONFIRM_BUTTON_COLOR,
  cancelButtonColor: "#64748b",
} as const;

/** Menampilkan dialog notifikasi sukses. */
export function showSuccessDialog(title: string, text?: string) {
  return Swal.fire({
    ...baseDialog,
    icon: "success",
    title,
    text,
  });
}

/** Menampilkan dialog notifikasi kesalahan. */
export function showErrorDialog(title: string, text?: string) {
  return Swal.fire({
    ...baseDialog,
    icon: "error",
    title,
    text,
  });
}

/** Menampilkan dialog notifikasi peringatan. */
export function showWarningDialog(title: string, text?: string) {
  return Swal.fire({
    ...baseDialog,
    icon: "warning",
    title,
    text,
  });
}

/**
 * Menampilkan dialog konfirmasi (ya/tidak).
 *
 * @returns `true` bila pengguna menekan tombol konfirmasi.
 */
export async function showConfirmDialog(
  title: string,
  text?: string,
  confirmButtonText = "Ya, lanjutkan",
): Promise<boolean> {
  const result = await Swal.fire({
    ...baseDialog,
    icon: "warning",
    title,
    text,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText: "Batal",
  });

  return result.isConfirmed;
}

/**
 * Memformat tanggal/waktu menjadi teks berbahasa Indonesia
 * (contoh: `5 Oktober 2024 pukul 10.07`).
 *
 * @param value tanggal dalam bentuk string ISO maupun objek `Date`.
 * @param withTime bila `false`, hanya bagian tanggal yang ditampilkan.
 * @returns teks tanggal, atau `"-"` bila nilai tidak valid.
 */
export function formatDate(value: string | Date, withTime = true): string {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "long",
    ...(withTime ? { timeStyle: "short" as const } : {}),
    timeZone: "Asia/Jakarta",
  }).format(date);
}

/** Basis URL aset statis (base API tanpa sufiks `/api/v1`). */
const ASSET_BASEURL = DELCOM_BASEURL.replace(/\/api\/v1\/?$/, "");

/**
 * Mengubah nilai `photo` / `cover` dari API menjadi URL gambar yang utuh.
 *
 * API Delcom kadang mengembalikan URL absolut dan kadang path relatif
 * (contoh: `img/profile/3_1709251633.png`).
 *
 * @returns URL utuh, atau `null` bila tidak ada gambar.
 */
export function resolveImageUrl(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return `${ASSET_BASEURL}/${value.replace(/^\/+/, "")}`;
}
