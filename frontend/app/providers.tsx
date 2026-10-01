"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useState } from "react";
import { LocaleProvider } from "@/components/locale-provider";
import type { Locale } from "@/lib/locale-constants";

export default function Providers({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 30,
            retry: 1,
            refetchOnWindowFocus: false,
            // Offline, still try once: the service worker answers from its cache.
            networkMode: "offlineFirst",
          },
          mutations: {
            // No offline writes in MVP: fail right away with the offline message
            // instead of pausing and silently replaying when back online.
            networkMode: "always",
          },
        },
      })
  );

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey="casedex-theme"
    >
      <QueryClientProvider client={client}>
        <LocaleProvider initialLocale={initialLocale}>
          {children}
        </LocaleProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

