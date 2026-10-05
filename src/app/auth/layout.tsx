import type { ReactNode } from "react";

import AuthLayout from "@/features/auth/layouts/AuthLayout";

/** Layout rute autentikasi (`/auth/*`). */
export default function AuthRouteLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <AuthLayout>{children}</AuthLayout>;
}
