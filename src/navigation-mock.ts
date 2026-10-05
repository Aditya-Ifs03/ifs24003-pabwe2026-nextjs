import { vi } from "vitest";

/**
 * State & helper mock navigasi Next.js.
 *
 * Modul ini **sengaja tidak mengimpor apa pun dari kode aplikasi**. `src/setupTests.ts`
 * hanya boleh bergantung pada modul seringan ini, sebab berkas setup dievaluasi
 * sebelum `vi.mock(...)` pada berkas pengujian didaftarkan. Bila berkas setup ikut
 * menginstansiasi reducer/API aplikasi, modul-modul tersebut akan ter-cache lebih
 * dulu sehingga `vi.mock` pada berkas pengujian tidak lagi berpengaruh.
 */

/** Mock objek router yang dikembalikan `useRouter()`. */
export const navigationMock = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
};

let routeParams: Record<string, string> = {};
let searchParams = new URLSearchParams();
let pathname = "/";

/** Mengatur nilai yang dikembalikan `useParams()`. */
export function setRouteParams(params: Record<string, string>): void {
  routeParams = params;
}

/** Mengatur nilai yang dikembalikan `useSearchParams()`. */
export function setSearchParams(init?: string | Record<string, string>): void {
  searchParams = new URLSearchParams(init);
}

/** Mengatur nilai yang dikembalikan `usePathname()`. */
export function setPathname(value: string): void {
  pathname = value;
}

/** Nilai `useParams()` saat ini. */
export function getRouteParams(): Record<string, string> {
  return routeParams;
}

/** Nilai `useSearchParams()` saat ini. */
export function getSearchParams(): URLSearchParams {
  return searchParams;
}

/** Nilai `usePathname()` saat ini. */
export function getPathname(): string {
  return pathname;
}

/** Mengembalikan seluruh mock navigasi ke kondisi awal. */
export function resetNavigation(): void {
  routeParams = {};
  searchParams = new URLSearchParams();
  pathname = "/";
  Object.values(navigationMock).forEach((mockFn) => {
    mockFn.mockReset();
  });
}
