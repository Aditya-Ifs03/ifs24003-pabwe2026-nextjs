import { fireEvent } from "@testing-library/react";
import { createElement } from "react";
import { describe, expect, it } from "vitest";

import { setAuthLogin } from "@/features/auth/states/action";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { renderWithProviders } from "@/test-utils";

/**
 * Pengujian `src/hooks/redux.ts` melalui komponen kecil yang memakai kedua
 * hook bertipe tersebut.
 */

/** Komponen uji: membaca state dan mengirim action ke store. */
function KomponenUji() {
  const dispatch = useAppDispatch();
  const isAuthLogin = useAppSelector((state) => state.auth.isAuthLogin);

  return createElement(
    "div",
    null,
    createElement("span", { "data-testid": "status" }, String(isAuthLogin)),
    createElement(
      "button",
      { type: "button", onClick: () => dispatch(setAuthLogin(true)) },
      "Masuk",
    ),
  );
}

describe("hooks redux bertipe", () => {
  it("useAppSelector membaca nilai dari state store", () => {
    const { getByTestId } = renderWithProviders(createElement(KomponenUji), {
      preloadedState: {
        auth: {
          isAuthLogin: true,
          isAuthRegister: false,
          isAuthLogout: false,
        },
      },
    });

    expect(getByTestId("status")).toHaveTextContent("true");
  });

  it("useAppDispatch mengirim action sehingga state store berubah", () => {
    const { getByRole, getByTestId, store } = renderWithProviders(
      createElement(KomponenUji),
    );

    expect(getByTestId("status")).toHaveTextContent("false");

    fireEvent.click(getByRole("button", { name: "Masuk" }));

    expect(getByTestId("status")).toHaveTextContent("true");
    expect(store.getState().auth.isAuthLogin).toBe(true);
  });
});
