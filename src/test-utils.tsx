import { combineReducers, configureStore } from "@reduxjs/toolkit";
import {
  render,
  type RenderOptions,
  type RenderResult,
} from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { Provider } from "react-redux";

import authReducer from "@/features/auth/states/reducer";
import postsReducer from "@/features/posts/states/reducer";
import usersReducer from "@/features/users/states/reducer";

/**
 * Helper pengujian kustom.
 *
 * Menyediakan `renderWithProviders` untuk me-render komponen yang terhubung
 * dengan Redux store. Helper mock navigasi Next.js (`next/navigation`)
 * didefinisikan pada `@/navigation-mock` dan di-ekspor ulang dari sini agar
 * berkas pengujian cukup mengimpor satu modul.
 */

export * from "@/navigation-mock";

/** Root reducer gabungan yang dipakai pada pengujian. */
export const testRootReducer = combineReducers({
  auth: authReducer,
  users: usersReducer,
  posts: postsReducer,
});

/** Bentuk state lengkap aplikasi untuk keperluan pengujian. */
export type TestRootState = ReturnType<typeof testRootReducer>;

/** Membuat store Redux baru yang terisolasi untuk setiap skenario pengujian. */
export function makeStore(preloadedState?: Partial<TestRootState>) {
  return configureStore({
    reducer: testRootReducer,
    preloadedState,
  });
}

/** Tipe store hasil {@link makeStore}. */
export type TestStore = ReturnType<typeof makeStore>;

/** Opsi tambahan untuk {@link renderWithProviders}. */
export interface RenderWithProvidersOptions
  extends Omit<RenderOptions, "wrapper"> {
  /** State awal store. */
  preloadedState?: Partial<TestRootState>;
  /** Store yang ingin dipakai ulang (opsional). */
  store?: TestStore;
}

/**
 * Me-render `ui` di dalam `<Provider store={store}>` sehingga komponen yang
 * menggunakan `useAppSelector` / `useAppDispatch` dapat diuji.
 */
export function renderWithProviders(
  ui: ReactElement,
  options: RenderWithProvidersOptions = {},
): RenderResult & { store: TestStore } {
  const {
    preloadedState,
    store = makeStore(preloadedState),
    ...renderOptions
  } = options;

  function Wrapper({ children }: { children: ReactNode }) {
    return <Provider store={store}>{children}</Provider>;
  }

  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}
