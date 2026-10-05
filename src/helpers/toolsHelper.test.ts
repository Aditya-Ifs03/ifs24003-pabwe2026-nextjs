import Swal from "sweetalert2";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  formatDate,
  resolveImageUrl,
  showConfirmDialog,
  showErrorDialog,
  showSuccessDialog,
  showWarningDialog,
} from "@/helpers/toolsHelper";
import { DELCOM_BASEURL } from "@/lib/config";

/**
 * Pengujian `src/helpers/toolsHelper.ts`.
 *
 * Modul `sweetalert2` diganti mock sehingga dialog tidak benar-benar dibuka di
 * DOM; yang diperiksa adalah opsi yang dikirim ke `Swal.fire`.
 */
vi.mock("sweetalert2", () => ({
  default: { fire: vi.fn() },
}));

/** Mock `Swal.fire`. */
const fireMock = vi.mocked(Swal.fire);

/** Opsi dasar yang selalu disertakan seluruh dialog. */
const baseDialog = {
  confirmButtonColor: "#0d9488",
  cancelButtonColor: "#64748b",
};

/** Membuat hasil `Swal.fire` tiruan. */
function hasilSwal(isConfirmed: boolean) {
  return { isConfirmed } as Awaited<ReturnType<typeof Swal.fire>>;
}

beforeEach(() => {
  fireMock.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("dialog notifikasi", () => {
  it("showSuccessDialog memanggil Swal.fire dengan opsi sukses", () => {
    showSuccessDialog("Berhasil", "Data sudah tersimpan");

    expect(fireMock).toHaveBeenCalledTimes(1);
    expect(fireMock).toHaveBeenCalledWith({
      ...baseDialog,
      icon: "success",
      title: "Berhasil",
      text: "Data sudah tersimpan",
    });
  });

  it("showSuccessDialog tetap berjalan tanpa teks tambahan", () => {
    showSuccessDialog("Berhasil");

    expect(fireMock).toHaveBeenCalledWith({
      ...baseDialog,
      icon: "success",
      title: "Berhasil",
      text: undefined,
    });
  });

  it("showErrorDialog memanggil Swal.fire dengan opsi kesalahan", () => {
    showErrorDialog("Gagal", "Terjadi kesalahan");

    expect(fireMock).toHaveBeenCalledWith({
      ...baseDialog,
      icon: "error",
      title: "Gagal",
      text: "Terjadi kesalahan",
    });
  });

  it("showWarningDialog memanggil Swal.fire dengan opsi peringatan", () => {
    showWarningDialog("Perhatian", "Periksa kembali data Anda");

    expect(fireMock).toHaveBeenCalledWith({
      ...baseDialog,
      icon: "warning",
      title: "Perhatian",
      text: "Periksa kembali data Anda",
    });
  });
});

describe("showConfirmDialog", () => {
  it("mengembalikan true saat pengguna menekan tombol konfirmasi", async () => {
    fireMock.mockResolvedValue(hasilSwal(true));

    await expect(
      showConfirmDialog("Hapus postingan?", "Data akan hilang permanen"),
    ).resolves.toBe(true);

    expect(fireMock).toHaveBeenCalledWith({
      ...baseDialog,
      icon: "warning",
      title: "Hapus postingan?",
      text: "Data akan hilang permanen",
      showCancelButton: true,
      confirmButtonText: "Ya, lanjutkan",
      cancelButtonText: "Batal",
    });
  });

  it("mengembalikan false saat pengguna membatalkan", async () => {
    fireMock.mockResolvedValue(hasilSwal(false));

    await expect(showConfirmDialog("Hapus postingan?")).resolves.toBe(false);

    expect(fireMock).toHaveBeenCalledWith({
      ...baseDialog,
      icon: "warning",
      title: "Hapus postingan?",
      text: undefined,
      showCancelButton: true,
      confirmButtonText: "Ya, lanjutkan",
      cancelButtonText: "Batal",
    });
  });

  it("memakai confirmButtonText kustom bila diberikan", async () => {
    fireMock.mockResolvedValue(hasilSwal(true));

    await expect(
      showConfirmDialog("Simpan perubahan?", undefined, "Simpan sekarang"),
    ).resolves.toBe(true);

    expect(fireMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Simpan perubahan?",
        confirmButtonText: "Simpan sekarang",
      }),
    );
  });
});

describe("formatDate", () => {
  const tanggal = new Date("2024-10-05T03:07:00.000Z");

  it("memformat objek Date beserta waktu", () => {
    expect(formatDate(tanggal)).toBe("5 Oktober 2024 pukul 10.07");
  });

  it("memformat string ISO beserta waktu", () => {
    expect(formatDate("2024-10-05T03:07:00.000Z")).toBe(
      "5 Oktober 2024 pukul 10.07",
    );
  });

  it("hanya menampilkan tanggal saat withTime false", () => {
    expect(formatDate(tanggal, false)).toBe("5 Oktober 2024");
  });

  it("mengembalikan tanda hubung untuk nilai yang tidak valid", () => {
    expect(formatDate("bukan tanggal")).toBe("-");
    expect(formatDate(new Date("tidak valid"))).toBe("-");
  });
});

describe("resolveImageUrl", () => {
  /** Basis aset: base API tanpa sufiks `/api/v1`. */
  const assetBaseUrl = DELCOM_BASEURL.replace(/\/api\/v1\/?$/, "");

  it("mengembalikan null untuk nilai kosong", () => {
    expect(resolveImageUrl()).toBeNull();
    expect(resolveImageUrl(null)).toBeNull();
    expect(resolveImageUrl("")).toBeNull();
  });

  it("mengembalikan URL absolut apa adanya", () => {
    expect(resolveImageUrl("https://contoh.test/img.png")).toBe(
      "https://contoh.test/img.png",
    );
    expect(resolveImageUrl("http://contoh.test/img.png")).toBe(
      "http://contoh.test/img.png",
    );
  });

  it("menggabungkan path relatif dengan basis aset", () => {
    expect(resolveImageUrl("img/profile/3_1709251633.png")).toBe(
      `${assetBaseUrl}/img/profile/3_1709251633.png`,
    );
  });

  it("menghapus awalan slash pada path relatif", () => {
    expect(resolveImageUrl("/img/profile/foto.png")).toBe(
      `${assetBaseUrl}/img/profile/foto.png`,
    );
  });
});
