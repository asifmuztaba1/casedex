import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--wash)] px-4 text-center">
      <h1 className="text-6xl font-semibold text-[var(--foreground)]">404</h1>
      <p className="mt-4 text-lg text-[var(--muted)]">
        The page you are looking for does not exist.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-lg bg-[var(--foreground)] px-5 py-2.5 text-sm font-medium text-[var(--paper)] hover:opacity-90"
      >
        Go home
      </Link>
    </div>
  );
}
