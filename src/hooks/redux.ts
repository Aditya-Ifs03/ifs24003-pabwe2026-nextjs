import { useDispatch, useSelector } from "react-redux";

import type { AppDispatch, RootState } from "@/store";

/**
 * Versi `useDispatch` yang sudah bertipe `AppDispatch`, sehingga thunk
 * (termasuk thunk asinkron) dapat dipanggil tanpa cast manual.
 */
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();

/**
 * Versi `useSelector` yang sudah bertipe `RootState`, sehingga `state`
 * memiliki autocomplete untuk seluruh slice.
 */
export const useAppSelector = useSelector.withTypes<RootState>();
