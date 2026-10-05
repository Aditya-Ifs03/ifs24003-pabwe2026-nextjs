import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import PostLayout from "@/features/posts/layouts/PostLayout";
import { asyncGetProfile } from "@/features/users/states/action";
import { getAccessToken } from "@/helpers/apiHelper";
import { navigationMock, renderWithProviders } from "@/test-utils";

/* -------------------------------------------------------------------------- */
/*                                    Mock                                    */
/* -------------------------------------------------------------------------- */

vi.mock("@/helpers/apiHelper", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/helpers/apiHelper")>();

  return {
    ...actual,
    getAccessToken: vi.fn(() => null),
    putAccessToken: vi.fn(),
  };
});

vi.mock("@/features/users/states/action", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/features/users/states/action")>();

  // Thunk asli diganti mock yang mengembalikan nilai aman, sedangkan
  // `.pending/.fulfilled/.rejected` tetap memakai milik thunk asli supaya
  // `createSlice` pada reducer users tidak gagal saat modul dimuat.
  const asyncGetProfile = Object.assign(
    vi.fn(() => ({ type: "users/asyncGetProfile/pending" })),
    {
      pending: actual.asyncGetProfile.pending,
      fulfilled: actual.asyncGetProfile.fulfilled,
      rejected: actual.asyncGetProfile.rejected,
    },
  );

  return { ...actual, asyncGetProfile };
});

/* -------------------------------------------------------------------------- */
/*                                   Helper                                   */
/* -------------------------------------------------------------------------- */

/** Merender layout dashboard dengan konten anak sebagai penanda. */
function renderLayout() {
  return renderWithProviders(
    <PostLayout>
      <p>Konten dashboard</p>
    </PostLayout>,
  );
}

/** Tombol overlay penutup drawer sidebar. */
function overlaySidebar(): HTMLElement | null {
  return screen.queryByRole("button", { name: "Tutup menu navigasi" });
}

/* -------------------------------------------------------------------------- */
/*                                   Skenario                                 */
/* -------------------------------------------------------------------------- */

describe("PostLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAccessToken).mockReturnValue(null);
  });

  it("mengalihkan ke /auth/login dan tidak menampilkan konten saat tanpa access token", async () => {
    renderLayout();

    await waitFor(() => {
      expect(navigationMock.replace).toHaveBeenCalledWith("/auth/login");
    });

    expect(screen.queryByText("Konten dashboard")).not.toBeInTheDocument();
    expect(asyncGetProfile).not.toHaveBeenCalled();
  });

  it("menampilkan konten dan memuat profil saat access token tersedia", async () => {
    vi.mocked(getAccessToken).mockReturnValue("token-uji");

    renderLayout();

    expect(await screen.findByText("Konten dashboard")).toBeInTheDocument();
    expect(asyncGetProfile).toHaveBeenCalledTimes(1);
    expect(navigationMock.replace).not.toHaveBeenCalled();
  });

  it("membuka drawer sidebar lewat tombol hamburger dan menutupnya lewat overlay", async () => {
    const user = userEvent.setup();
    vi.mocked(getAccessToken).mockReturnValue("token-uji");

    renderLayout();

    await screen.findByText("Konten dashboard");
    expect(overlaySidebar()).not.toBeInTheDocument();
    expect(
      screen.getByRole("complementary", { name: "Navigasi utama" }),
    ).toHaveClass("-translate-x-full");

    await user.click(screen.getByRole("button", { name: "Buka menu navigasi" }));

    const overlay = overlaySidebar();
    expect(overlay).toBeInTheDocument();
    expect(
      screen.getByRole("complementary", { name: "Navigasi utama" }),
    ).toHaveClass("translate-x-0");

    await user.click(overlay as HTMLElement);

    expect(overlaySidebar()).not.toBeInTheDocument();
    expect(
      screen.getByRole("complementary", { name: "Navigasi utama" }),
    ).toHaveClass("-translate-x-full");
  });
});
