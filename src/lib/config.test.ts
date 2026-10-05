import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * Pengujian `src/lib/config.ts`.
 *
 * `DELCOM_BASEURL` dan `APP_PORT` dibaca sekali saat modul diimpor, sehingga
 * setiap skenario melakukan `vi.resetModules()` lebih dahulu lalu mengimpor
 * ulang modul dengan nilai env yang di-stub.
 */

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("konfigurasi lingkungan", () => {
  it("memakai nilai env saat variabel lingkungan diisi", async () => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_DELCOM_BASEURL", "https://contoh.test/api/v1");
    vi.stubEnv("APP_PORT", "4321");

    const config = await import("@/lib/config");

    expect(config.DELCOM_BASEURL).toBe("https://contoh.test/api/v1");
    expect(config.APP_PORT).toBe("4321");
  });

  it("memakai nilai bawaan saat variabel lingkungan kosong", async () => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_DELCOM_BASEURL", "");
    vi.stubEnv("APP_PORT", "");

    const config = await import("@/lib/config");

    expect(config.DELCOM_BASEURL).toBe(config.DEFAULT_DELCOM_BASEURL);
    expect(config.APP_PORT).toBe(config.DEFAULT_APP_PORT);
  });

  it("menyediakan konstanta nilai bawaan yang benar", async () => {
    const config = await import("@/lib/config");

    expect(config.DEFAULT_DELCOM_BASEURL).toBe(
      "https://open-api.delcom.org/api/v1",
    );
    expect(config.DEFAULT_APP_PORT).toBe("3000");
  });
});
