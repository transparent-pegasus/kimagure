import type { Metadata } from "next";

import { GoogleAnalytics } from "@next/third-parties/google";
import { Suspense } from "react";

import { BottomNav } from "@/components/layout/BottomNav";
import { Header } from "@/components/layout/Header";

import { Providers } from "./providers";

import "./globals.css";

export const metadata: Metadata = {
  description: "その日の献立を調整・提案するアプリケーション",
  icons: {
    apple: "/icon-192x192.png",
    icon: "/icon-192x192.png",
  },
  title: "きまぐれごはん",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" type="image/png" href="/icon-192x192.png" />
        <meta name="theme-color" content="#fbbf24" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=M+PLUS+Rounded+1c:wght@400;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`antialiased font-rounded bg-background text-foreground`}
        style={
          {
            "--font-rounded": '"M PLUS Rounded 1c", sans-serif',
            "--font-sans": '"Inter", sans-serif',
          } as React.CSSProperties
        }
      >
        <Providers>
          <div className="flex flex-col h-[100dvh] max-w-screen-sm mx-auto bg-background border-x border-border/50 shadow-2xl relative">
            <Header />
            <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 pb-20 no-scrollbar">
              {children}
            </main>
            <Suspense fallback={<div className="h-16 bg-background animate-pulse" />}>
              <BottomNav />
            </Suspense>
          </div>
        </Providers>
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
        )}
      </body>
    </html>
  );
}
