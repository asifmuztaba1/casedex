import type { Metadata } from "next";
import { cookies } from "next/headers";
import localFont from "next/font/local";
import Providers from "./providers";
import ServiceWorkerRegister from "@/pwa/sw-register";
import { Toaster } from "@/components/ui/toaster";
import type { Locale } from "@/lib/locale-constants";
import { STORAGE_KEY } from "@/lib/locale-constants";
import "./globals.css";

// Fonts are served from app/fonts (the same files Google Fonts serves), so builds
// never depend on downloading them. Licences: app/fonts/OFL-*.txt
const plexSans = localFont({
  variable: "--font-plex-sans",
  src: [{ path: "./fonts/ibm-plex-sans-latin.woff2", weight: "100 700", style: "normal" }],
});

const spectral = localFont({
  variable: "--font-spectral",
  src: [
    { path: "./fonts/spectral-400-latin.woff2", weight: "400", style: "normal" },
    { path: "./fonts/spectral-600-latin.woff2", weight: "600", style: "normal" },
    { path: "./fonts/spectral-700-latin.woff2", weight: "700", style: "normal" },
  ],
});

const bengaliSans = localFont({
  variable: "--font-bengali",
  src: [{ path: "./fonts/noto-sans-bengali.woff2", weight: "100 900", style: "normal" }],
});

export const metadata: Metadata = {
  title: {
    default: "CaseDex — Every case, every hearing — in one place.",
    template: "%s | CaseDex",
  },
  description:
    "CaseDex is a structured case workspace for legal professionals and law students. Organize hearings, documents, diary entries, and research in one secure workspace.",
  manifest: "/manifest.json",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://casedex.app"
  ),
  openGraph: {
    type: "website",
    siteName: "CaseDex",
    title: "CaseDex — Every case, every hearing — in one place.",
    description:
      "A structured case workspace for legal professionals and law students. Track hearings, documents, and diary entries with clarity.",
    images: [{ url: "/og-image.svg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "CaseDex — Every case, every hearing — in one place.",
    description:
      "A structured case workspace for legal professionals and law students.",
    images: ["/og-image.svg"],
  },
  icons: {
    icon: [
      { url: "/icons/icon-32.svg", sizes: "32x32", type: "image/svg+xml" },
      { url: "/icons/icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
    ],
    apple: [
      {
        url: "/icons/apple-touch-icon.svg",
        sizes: "180x180",
        type: "image/svg+xml",
      },
    ],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const storedLocale = cookieStore.get(STORAGE_KEY)?.value;
  const initialLocale: Locale = storedLocale === "bn" || storedLocale === "en" ? storedLocale : "en";

  return (
    <html lang={initialLocale} suppressHydrationWarning>
      <body
        className={`${plexSans.variable} ${spectral.variable} ${bengaliSans.variable} antialiased`}
      >
        <Providers initialLocale={initialLocale}>
          {children}
          <ServiceWorkerRegister />
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}
