import DetailPage from "@/features/posts/pages/DetailPage";

/**
 * Rute `/posts/[postId]` — rincian postingan.
 *
 * Pada Next.js 16 `params` adalah `Promise` sehingga harus di-`await` terlebih
 * dahulu. Nilai `postId` dipakai sebagai `key` agar state halaman di-reset saat
 * berpindah antar postingan.
 */
export default async function Page({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const { postId } = await params;

  return <DetailPage key={postId} />;
}
