import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getAccessToken } from "@/helpers/apiHelper";
import { navigationMock, renderWithProviders } from "@/test-utils";

import AuthLayout from "./AuthLayout";

/**
 * Pengujian layout autentikasi.
 *
 * `getAccessToken` dimock agar proteksi sesi dapat diuji pada dua cabang:
 * token tersedia (dialihkan ke dashboard) dan token tidak tersedia.
 */
vi.mock("@/helpers/apiHelper", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/helpers/apiHelper")>();

  return { ...actual, getAccessToken: vi.fn() };
});

const getAccessTokenMock = vi.mocked(getAccessToken);

beforeEach(() => {
  getAccessTokenMock.mockReset();
});

describe("AuthLayout", () => {
  it("mengalihkan ke dashboard bila access token sudah tersedia", async () => {
    getAccessTokenMock.mockReturnValue("token-abc");

    renderWithProviders(
      <AuthLayout>
        <p>Konten Formulir</p>
      </AuthLayout>,
    );

    await waitFor(() => expect(navigationMock.replace).toHaveBeenCalledWith("/"));
    expect(navigationMock.replace).toHaveBeenCalledTimes(1);
    expect(navigationMock.push).not.toHaveBeenCalled();
  });

  it("menampilkan banner dan children tanpa pengalihan bila token tidak ada", async () => {
    getAccessTokenMock.mockReturnValue(null);

    renderWithProviders(
      <AuthLayout>
        <p>Konten Formulir</p>
      </AuthLayout>,
    );

    // Efek sudah dijalankan ketika pemanggilan token terdeteksi.
    await waitFor(() => expect(getAccessTokenMock).toHaveBeenCalled());
    expect(navigationMock.replace).not.toHaveBeenCalled();

    expect(screen.getByText("Konten Formulir")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Bagikan cerita");
    expect(screen.getByText("Delcom Postingan")).toBeInTheDocument();
    expect(screen.getByText("Aplikasi linimasa postingan berbasis Next.js dan REST API Delcom Open API.")).toBeInTheDocument();
    expect(screen.getByText("Publikasikan momen dan gagasanmu dalam hitungan detik.")).toBeInTheDocument();
    expect(screen.getByText("Sukai dan komentari postingan pengguna lain.")).toBeInTheDocument();
    expect(screen.getByText("Kelola profil, foto, dan kata sandi dengan aman.")).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
  });
});
