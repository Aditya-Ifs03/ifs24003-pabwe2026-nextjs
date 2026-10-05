import type { ReactNode } from "react";

import PostLayout from "@/features/posts/layouts/PostLayout";

/**
 * Layout dashboard terproteksi.
 *
 * Route group `(dashboard)` tidak muncul pada URL, sehingga rute-rute di
 * dalamnya tetap `/`, `/posts/[postId]`, `/users`, dan `/profile`.
 */
export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <PostLayout>{children}</PostLayout>;
}
