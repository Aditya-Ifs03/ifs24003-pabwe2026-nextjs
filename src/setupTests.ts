import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";

import { resetNavigation } from "@/navigation-mock";

/**
 * Konfigurasi lingkungan pengujian Vitest + jsdom.
 *
 * PENTING: berkas ini hanya boleh mengimpor modul pengujian yang ringan
 * (`@/navigation-mock`). Berkas setup dievaluasi **sebelum** `vi.mock(...)` pada
 * berkas pengujian didaftarkan, sehingga mengimpor kode aplikasi di sini akan
 * membuat modul tersebut ter-cache lebih dulu dan membuat `vi.mock` pada berkas
 * pengujian tidak berpengaruh.
 */

/**
 * Mock `next/navigation`.
 *
 * Komponen yang diuji berjalan di luar runtime App Router, sehingga hook
 * navigasi Next.js perlu digantikan implementasi terkendali. Nilai yang
 * dikembalikan dapat diatur melalui helper pada `@/navigation-mock`.
 */
vi.mock("next/navigation", async () => {
  const helpers = await import("@/navigation-mock");

  return {
    useRouter: () => helpers.navigationMock,
    useParams: () => helpers.getRouteParams(),
    useSearchParams: () => helpers.getSearchParams(),
    usePathname: () => helpers.getPathname(),
    useSelectedLayoutSegment: () => null,
    useSelectedLayoutSegments: () => [],
    redirect: vi.fn(),
    notFound: vi.fn(),
    ReadonlyURLSearchParams: URLSearchParams,
  };
});

// jsdom belum mengimplementasikan API berikut, padahal dipakai komponen UI.
if (!window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  });
}

if (!window.scrollTo) {
  Object.defineProperty(window, "scrollTo", { writable: true, value: vi.fn() });
}

// jsdom 30 sudah menyediakan Object URL, tetapi nilainya berupa UUID acak
// (`blob:nodedata:<uuid>`) sehingga tidak dapat diasersi. Stub ini dipasang tanpa
// syarat agar pratinjau berkas menghasilkan URL yang deterministik di semua
// berkas pengujian.
Object.defineProperty(URL, "createObjectURL", {
  writable: true,
  value: vi.fn(() => "blob:mock-preview"),
});

Object.defineProperty(URL, "revokeObjectURL", {
  writable: true,
  value: vi.fn(),
});

beforeEach(() => {
  resetNavigation();
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});
