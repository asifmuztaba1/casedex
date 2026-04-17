import type { Metadata } from "next";
import { cookies } from "next/headers";
import { IBM_Plex_Sans, Noto_Sans_Bengali, Spectral } from "next/font/google";
import Providers from "./providers";
import ServiceWorkerRegister from "@/pwa/sw-register";
import InstallPrompt from "@/pwa/install-prompt";
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
          {/* <InstallPrompt /> */}
          <ServiceWorkerRegister />
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}
