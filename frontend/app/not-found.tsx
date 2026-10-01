import Link from "next/link";
import { cookies } from "next/headers";
import { translate } from "@/lib/i18n";
import { STORAGE_KEY } from "@/lib/locale-constants";

export default async function NotFound() {
  const locale = (await cookies()).get(STORAGE_KEY)?.value === "bn" ? "bn" : "en";
  const t = (key: string) => translate(locale, key);
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--wash)] px-4 text-center">
      <h1 className="text-6xl font-semibold text-[var(--foreground)]">404</h1>
      <p className="mt-4 text-lg text-[var(--muted)]">
        {t("notfound.desc")}
      </p>
      <Link
        href="/"
        className="mt-6 rounded-lg bg-[var(--foreground)] px-5 py-2.5 text-sm font-medium text-[var(--paper)] hover:opacity-90"
      >
        {t("notfound.go_home")}
      </Link>
    </div>
  );
}
