import { act, renderHook } from "@testing-library/react";
import type { ChangeEvent } from "react";
import { describe, expect, it } from "vitest";

import useInput from "@/hooks/useInput";

/** Membuat event `change` tiruan untuk pengujian. */
function changeEvent(value: string): ChangeEvent<HTMLInputElement> {
  return { target: { value } } as ChangeEvent<HTMLInputElement>;
}

describe("useInput", () => {
  it("mengembalikan nilai awal yang diberikan", () => {
    const { result } = renderHook(() => useInput("awal"));

    expect(result.current.value).toBe("awal");
  });

  it("memakai string kosong sebagai nilai awal bawaan", () => {
    const { result } = renderHook(() => useInput());

    expect(result.current.value).toBe("");
  });

  it("memperbarui nilai melalui handleChange", () => {
    const { result } = renderHook(() => useInput(""));

    act(() => {
      result.current.handleChange(changeEvent("teks baru"));
    });

    expect(result.current.value).toBe("teks baru");
  });

  it("memperbarui nilai melalui setValue", () => {
    const { result } = renderHook(() => useInput(""));

    act(() => {
      result.current.setValue("diubah manual");
    });

    expect(result.current.value).toBe("diubah manual");
  });

  it("mengembalikan nilai ke nilai awal melalui reset", () => {
    const { result } = renderHook(() => useInput("semula"));

    act(() => {
      result.current.setValue("berubah");
    });
    expect(result.current.value).toBe("berubah");

    act(() => {
      result.current.reset();
    });
    expect(result.current.value).toBe("semula");
  });
});
