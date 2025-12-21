import type { Metadata } from "next";
import { IBM_Plex_Sans, Spectral } from "next/font/google";
import OfflineIndicator from "@/components/offline-indicator";
import Providers from "./providers";
import ServiceWorkerRegister from "@/pwa/sw-register";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const spectral = Spectral({
  variable: "--font-spectral",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "CaseDex",
  description:
    "CaseDex is a structured case workspace for legal professionals and law students.",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${plexSans.variable} ${spectral.variable} antialiased`}
      >
        <Providers>
          <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
            <header className="border-b border-slate-200 bg-white">
              <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
                <div className="text-lg font-semibold tracking-tight">
                  CaseDex™
                </div>
                <OfflineIndicator />
              </div>
            </header>
            <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
              {children}
            </main>
          </div>
        </Providers>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
