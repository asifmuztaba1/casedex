import type { Metadata } from "next";
import { cookies } from "next/headers";
import { IBM_Plex_Sans, Noto_Sans_Bengali, Spectral } from "next/font/google";
import Providers from "./providers";
import ServiceWorkerRegister from "@/pwa/sw-register";
import { Toaster } from "@/components/ui/toaster";
import type { Locale } from "@/lib/locale-constants";
import { STORAGE_KEY } from "@/lib/locale-constants";
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

const bengaliSans = Noto_Sans_Bengali({
  variable: "--font-bengali",
  subsets: ["bengali"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "CaseDex",
  description:
    "CaseDex is a structured case workspace for legal professionals and law students.",
  manifest: "/manifest.json",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const storedLocale = cookieStore.get(STORAGE_KEY)?.value;
  const initialLocale: Locale = storedLocale === "bn" || storedLocale === "en" ? storedLocale : "en";

  return (
    <html lang={initialLocale}>
      <body
        className={`${plexSans.variable} ${spectral.variable} ${bengaliSans.variable} antialiased`}
      >
        <Providers initialLocale={initialLocale}>{children}</Providers>
        <Toaster />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
