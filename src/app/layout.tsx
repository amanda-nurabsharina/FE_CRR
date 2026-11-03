import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Court Recording & Report System — Secure SaaS Edition",
  description: "Aplikasi Perekaman Sidang Kedap Bocor & Pembuat Berita Acara Sidang Forensik Berstandar Yuridis",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-amber-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
