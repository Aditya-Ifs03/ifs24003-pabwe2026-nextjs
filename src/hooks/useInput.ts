"use client";

import { useCallback, useState, type ChangeEvent } from "react";

/** Elemen formulir yang didukung oleh {@link useInput}. */
export type InputElement =
  | HTMLInputElement
  | HTMLTextAreaElement
  | HTMLSelectElement;

/** Nilai kembalian hook {@link useInput}. */
export interface UseInputResult {
  /** Nilai input saat ini. */
  value: string;
  /** Handler `onChange` yang menyinkronkan nilai input ke state. */
  handleChange: (event: ChangeEvent<InputElement>) => void;
  /** Mengubah nilai input secara manual. */
  setValue: (value: string) => void;
  /** Mengembalikan nilai input ke nilai awal. */
  reset: () => void;
}

/**
 * Custom hook reusable untuk mengelola *two-way data binding* pada elemen
 * formulir.
 *
 * @example
 * ```tsx
 * const { value, handleChange } = useInput("");
 * <input value={value} onChange={handleChange} />
 * ```
 */
export default function useInput(initialValue = ""): UseInputResult {
  const [value, setValue] = useState(initialValue);

  const handleChange = useCallback((event: ChangeEvent<InputElement>) => {
    setValue(event.target.value);
  }, []);

  const reset = useCallback(() => {
    setValue(initialValue);
  }, [initialValue]);

  return { value, handleChange, setValue, reset };
}
