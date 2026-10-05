import type { Metadata } from "next";
import { JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import type { ReactNode } from "react";

import Providers from "@/components/Providers";

import "./globals.css";

/**
 * Root layout aplikasi.
 *
 * Mengintegrasikan Google Font (Plus Jakarta Sans untuk tipografi utama dan
 * JetBrains Mono untuk teks monospace), berkas styling global `globals.css`,
 * serta pembungkus Redux `Providers`.
 */

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Delcom Postingan | ifs24003",
  description:
    "Aplikasi linimasa postingan berbasis Next.js, TypeScript, dan REST API Delcom Open API.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="id"
      className={`${plusJakartaSans.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
