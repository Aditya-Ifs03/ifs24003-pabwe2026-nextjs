import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import SidebarComponent from "@/features/posts/components/SidebarComponent";
import { setPathname, setSearchParams } from "@/test-utils";

/* -------------------------------------------------------------------------- */
/*                                   Helper                                   */
/* -------------------------------------------------------------------------- */

/** Merender sidebar dengan prop yang dapat ditimpa per skenario. */
function renderSidebar(props: { open?: boolean; onClose?: () => void } = {}) {
  const onClose = props.onClose ?? vi.fn();

  const utils = render(
    <SidebarComponent open={props.open ?? false} onClose={onClose} />,
  );

  return { onClose, ...utils };
}

/** Mengambil elemen drawer (aside) sidebar. */
function ambilDrawer(): HTMLElement {
  return screen.getByRole("complementary", { name: "Navigasi utama" });
}

/** Memastikan hanya tautan `label` yang bertanda aktif. */
function harapkanAktif(label: RegExp): void {
  const semuaLabel = [
    /Semua Postingan/i,
    /Postingan Saya/i,
    /Daftar Pengguna/i,
    /Profil Saya/i,
  ];

  semuaLabel.forEach((item) => {
    const tautan = screen.getByRole("link", { name: item });

    if (item.source === label.source) {
      expect(tautan).toHaveAttribute("aria-current", "page");
      return;
    }

    expect(tautan).not.toHaveAttribute("aria-current");
  });
}

/* -------------------------------------------------------------------------- */
/*                                   Skenario                                 */
/* -------------------------------------------------------------------------- */

describe("SidebarComponent", () => {
  it("menampilkan keempat item navigasi utama", () => {
    renderSidebar();

    expect(
      screen.getByRole("link", { name: /Semua Postingan/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Postingan Saya/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Daftar Pengguna/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Profil Saya/i }),
    ).toBeInTheDocument();
  });

  it("menandai 'Semua Postingan' aktif pada rute beranda tanpa filter", () => {
    setPathname("/");
    setSearchParams();
    renderSidebar();

    harapkanAktif(/Semua Postingan/i);
  });

  it("menandai 'Postingan Saya' aktif saat is_me=1 pada rute beranda", () => {
    setPathname("/");
    setSearchParams({ is_me: "1" });
    renderSidebar();

    harapkanAktif(/Postingan Saya/i);
  });

  it("menandai 'Daftar Pengguna' aktif pada rute /users", () => {
    setPathname("/users");
    renderSidebar();

    harapkanAktif(/Daftar Pengguna/i);
  });

  it("menandai 'Profil Saya' aktif pada rute /profile", () => {
    setPathname("/profile");
    renderSidebar();

    harapkanAktif(/Profil Saya/i);
  });

  it("menyembunyikan overlay dan menggeser drawer keluar saat open=false", () => {
    renderSidebar({ open: false });

    expect(
      screen.queryByRole("button", { name: "Tutup menu navigasi" }),
    ).not.toBeInTheDocument();

    const drawer = ambilDrawer();
    expect(drawer).toHaveClass("-translate-x-full");
    expect(drawer).not.toHaveClass("translate-x-0");
  });

  it("menampilkan overlay dan drawer saat open=true", () => {
    renderSidebar({ open: true });

    expect(
      screen.getByRole("button", { name: "Tutup menu navigasi" }),
    ).toBeInTheDocument();

    const drawer = ambilDrawer();
    expect(drawer).toHaveClass("translate-x-0");
    expect(drawer).not.toHaveClass("-translate-x-full");
  });

  it("memanggil onClose saat overlay diklik", async () => {
    const user = userEvent.setup();
    const { onClose } = renderSidebar({ open: true });

    await user.click(
      screen.getByRole("button", { name: "Tutup menu navigasi" }),
    );

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("memanggil onClose saat tombol 'Tutup menu' diklik", async () => {
    const user = userEvent.setup();
    const { onClose } = renderSidebar({ open: true });

    await user.click(screen.getByRole("button", { name: "Tutup menu" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("memanggil onClose saat salah satu tautan navigasi diklik", async () => {
    const user = userEvent.setup();
    const { onClose } = renderSidebar({ open: true });

    await user.click(screen.getByRole("link", { name: /Daftar Pengguna/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
