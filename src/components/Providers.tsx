"use client";

import type { ReactNode } from "react";
import { Provider } from "react-redux";

import { store } from "@/store";

/**
 * Komponen pembungkus (Client Component) yang menyediakan Redux store untuk
 * seluruh hierarki aplikasi.
 *
 * React Context tidak didukung di Server Component, karena itu pembungkus ini
 * berupa Client Component dan dipasang sedekat mungkin dengan konten.
 */
export default function Providers({ children }: { children: ReactNode }) {
  return <Provider store={store}>{children}</Provider>;
}
