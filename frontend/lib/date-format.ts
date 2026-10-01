import { format } from "date-fns";
import { bn } from "date-fns/locale";
import type { Locale } from "@/lib/locale-constants";

/**
 * Display formatting for dates shown to users. Uses date-fns patterns
 * ("PP", "PPp", "MMMM yyyy", ...) in the user's language. Keep using
 * date-fns `format` directly for machine values such as "yyyy-MM-dd".
 */
export function formatDate(date: Date | number | string, pattern: string, locale: Locale): string {
  const value = typeof date === "string" ? new Date(date) : date;
  return format(value, pattern, locale === "bn" ? { locale: bn } : undefined);
}
