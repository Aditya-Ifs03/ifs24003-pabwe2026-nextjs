"use client";

import { useRouter } from "next/navigation";
import {
  Suspense,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { asyncGetProfile } from "@/features/users/states/action";
import { getAccessToken } from "@/helpers/apiHelper";
import { useAppDispatch } from "@/hooks/redux";

import NavbarComponent from "../components/NavbarComponent";
import SidebarComponent from "../components/SidebarComponent";

/**
 * Shell layout dashboard utama.
 *
 * Bertanggung jawab atas:
 * - **Route guarding**: memastikan hanya pengguna yang memiliki access token
 *   dapat mengakses halaman, selain itu dialihkan ke `/auth/login`.
 * - **Pemuatan sesi**: mengambil profil pengguna yang sedang login.
 * - Menyusun Navbar, Sidebar (dengan drawer responsif), dan area konten utama.
 */
export default function PostLayout({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const [isAuthorized, setAuthorized] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!getAccessToken()) {
      router.replace("/auth/login");
      return;
    }

    // Route guarding: gerbang render dibuka setelah keberadaan token
    // terverifikasi. Efek ini menyinkronkan React dengan sistem eksternal
    // (localStorage) dan hanya berjalan sekali, sehingga setState di sini tidak
    // menimbulkan render berantai.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAuthorized(true);
    void dispatch(asyncGetProfile());
  }, [dispatch, router]);
  const openSidebar = useCallback(() => {
    setSidebarOpen(true);
  }, []);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  return (
    <div className="min-h-screen">
      <NavbarComponent onOpenSidebar={openSidebar} />

      <div className="mx-auto flex w-full max-w-7xl gap-6 px-4 py-6">
        <Suspense
          fallback={
            <div className="hidden w-72 shrink-0 lg:block" aria-hidden="true" />
          }
        >
          <SidebarComponent open={isSidebarOpen} onClose={closeSidebar} />
        </Suspense>

        <main className="min-w-0 flex-1">{isAuthorized ? children : null}</main>
      </div>
    </div>
  );
}
