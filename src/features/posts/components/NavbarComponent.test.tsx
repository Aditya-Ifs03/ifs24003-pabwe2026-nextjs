import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { asyncLogout } from "@/features/auth/states/action";
import { initialState as authInitialState } from "@/features/auth/states/reducer";
import NavbarComponent from "@/features/posts/components/NavbarComponent";
import { initialState as usersInitialState } from "@/features/users/states/reducer";
import { putAccessToken } from "@/helpers/apiHelper";
import { showSuccessDialog } from "@/helpers/toolsHelper";
import {
  navigationMock,
  renderWithProviders,
  type TestRootState,
} from "@/test-utils";
import type { User } from "@/types";

/* -------------------------------------------------------------------------- */
/*                                    Mock                                    */
/* -------------------------------------------------------------------------- */

vi.mock("@/features/auth/states/action", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/features/auth/states/action")>();

  // `asyncLogout` diganti mock, tetapi `.pending/.fulfilled/.rejected` milik
  // thunk asli tetap dibawa agar `createSlice` pada reducer auth tidak gagal
  // saat modul reducers dimuat.
  const asyncLogout = Object.assign(
    vi.fn(() => ({ type: "auth/asyncLogout/mock" })),
    {
      pending: actual.asyncLogout.pending,
      fulfilled: actual.asyncLogout.fulfilled,
      rejected: actual.asyncLogout.rejected,
    },
  );

  return { ...actual, asyncLogout };
});

vi.mock("@/helpers/apiHelper", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/helpers/apiHelper")>();

  return { ...actual, putAccessToken: vi.fn() };
});

vi.mock("@/helpers/toolsHelper", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/helpers/toolsHelper")>();

  return { ...actual, showSuccessDialog: vi.fn(async () => undefined) };
});

/* -------------------------------------------------------------------------- */
/*                                   Helper                                   */
/* -------------------------------------------------------------------------- */

/** Data pengguna contoh yang dipakai hampir di seluruh skenario. */
const contohUser: User = {
  id: 11,
  name: "Budi Santoso",
  email: "budi@contoh.test",
  email_verified_at: null,
  photo: null,
  created_at: "2026-01-02T03:04:05.000Z",
  updated_at: "2026-01-02T03:04:05.000Z",
};

/** Menyusun state awal store untuk slice `auth` dan `users`. */
function preloadedState(
  user: User | null,
  isAuthLogout = false,
): Partial<TestRootState> {
  return {
    auth: { ...authInitialState, isAuthLogout },
    users: { ...usersInitialState, user },
  };
}

/** Merender navbar dengan state pengguna tertentu. */
function renderNavbar(user: User | null, isAuthLogout = false) {
  const onOpenSidebar = vi.fn();

  const utils = renderWithProviders(
    <NavbarComponent onOpenSidebar={onOpenSidebar} />,
    { preloadedState: preloadedState(user, isAuthLogout) },
  );

  return { onOpenSidebar, ...utils };
}

/** Tombol pembuka dropdown menu profil. */
function tombolMenuProfil(): HTMLElement {
  return screen.getByRole("button", { name: "Menu profil" });
}

/* -------------------------------------------------------------------------- */
/*                                   Skenario                                 */
/* -------------------------------------------------------------------------- */

describe("NavbarComponent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("menampilkan nama pengguna dari state beserta ikon bawaan saat tanpa foto", () => {
    renderNavbar(contohUser);

    expect(tombolMenuProfil()).toHaveTextContent("Budi Santoso");
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("memakai teks 'Pengguna' dan 'Belum ada email' saat data pengguna kosong", async () => {
    const user = userEvent.setup();
    renderNavbar(null);

    expect(tombolMenuProfil()).toHaveTextContent("Pengguna");
    expect(screen.queryByRole("img")).not.toBeInTheDocument();

    await user.click(tombolMenuProfil());

    const menu = screen.getByRole("menu");
    expect(menu).toHaveTextContent("Pengguna");
    expect(menu).toHaveTextContent("Belum ada email");
  });

  it("menampilkan elemen img saat pengguna memiliki photo", () => {
    renderNavbar({ ...contohUser, photo: "https://contoh.test/avatar-budi.png" });

    const foto = screen.getByRole("img", { name: "Budi Santoso" });
    expect(foto).toHaveAttribute(
      "src",
      expect.stringContaining("avatar-budi.png"),
    );
  });

  it("memakai alt cadangan saat nama pengguna tidak tersedia", () => {
    renderNavbar({
      ...contohUser,
      name: undefined as unknown as string,
      photo: "img/avatar.png",
    });

    expect(screen.getByRole("img", { name: "Foto profil" })).toBeInTheDocument();
  });

  it("membuka dan menutup dropdown menu profil", async () => {
    const user = userEvent.setup();
    renderNavbar(contohUser);

    expect(tombolMenuProfil()).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    await user.click(tombolMenuProfil());

    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(tombolMenuProfil()).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByRole("menuitem", { name: /Profil Saya/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Keluar" })).toBeInTheDocument();

    await user.click(tombolMenuProfil());

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(tombolMenuProfil()).toHaveAttribute("aria-expanded", "false");
  });

  it("menutup dropdown saat tautan 'Profil Saya' diklik", async () => {
    const user = userEvent.setup();
    renderNavbar(contohUser);

    await user.click(tombolMenuProfil());
    expect(screen.getByRole("menu")).toBeInTheDocument();

    await user.click(screen.getByRole("menuitem", { name: /Profil Saya/i }));

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("menjalankan logout, membersihkan token, lalu mengalihkan ke halaman login", async () => {
    const user = userEvent.setup();
    renderNavbar(contohUser);

    await user.click(tombolMenuProfil());
    await user.click(screen.getByRole("menuitem", { name: "Keluar" }));

    await waitFor(() => {
      expect(navigationMock.replace).toHaveBeenCalledWith("/auth/login");
    });

    expect(asyncLogout).toHaveBeenCalledTimes(1);
    expect(putAccessToken).toHaveBeenCalledWith(null);
    expect(showSuccessDialog).toHaveBeenCalledWith(
      "Berhasil keluar",
      "Sampai jumpa kembali!",
    );
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("menonaktifkan tombol keluar dan menampilkan label 'Keluar...' saat logout berjalan", async () => {
    const user = userEvent.setup();
    renderNavbar(contohUser, true);

    await user.click(tombolMenuProfil());

    const tombolKeluar = screen.getByRole("menuitem", { name: "Keluar..." });
    expect(tombolKeluar).toBeDisabled();
    expect(navigationMock.replace).not.toHaveBeenCalled();
    expect(asyncLogout).not.toHaveBeenCalled();
  });

  it("memanggil onOpenSidebar saat tombol hamburger ditekan", async () => {
    const user = userEvent.setup();
    const { onOpenSidebar } = renderNavbar(contohUser);

    await user.click(screen.getByRole("button", { name: "Buka menu navigasi" }));

    expect(onOpenSidebar).toHaveBeenCalledTimes(1);
  });
});
