import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Providers from "@/components/Providers";
import { useAppSelector } from "@/hooks/redux";

/**
 * Pengujian `src/components/Providers.tsx`.
 *
 * Komponen ini membungkus aplikasi dengan `<Provider store={store}>` sehingga
 * hook Redux dapat dipakai oleh seluruh hierarki di bawahnya.
 */

/** Komponen anak yang membaca store dari React Context milik Provider. */
function AnakPenggunaStore() {
  const isAuthLogin = useAppSelector((state) => state.auth.isAuthLogin);

  return <span data-testid="status-auth">{String(isAuthLogin)}</span>;
}

describe("Providers", () => {
  it("menampilkan anak yang diberikan", () => {
    render(
      <Providers>
        <p>Konten anak</p>
      </Providers>,
    );

    expect(screen.getByText("Konten anak")).toBeInTheDocument();
  });

  it("menyediakan store Redux sehingga anak dapat memakai useAppSelector", () => {
    render(
      <Providers>
        <AnakPenggunaStore />
      </Providers>,
    );

    expect(screen.getByTestId("status-auth")).toHaveTextContent("false");
  });
});
