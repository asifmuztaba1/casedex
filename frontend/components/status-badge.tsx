import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  open: "bg-blue-50 text-blue-700 border-blue-200",
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  closed: "bg-[var(--wash)] text-[var(--muted)] border-[var(--border)]",
  archived: "bg-amber-50 text-amber-700 border-amber-200",
  pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
  scheduled: "bg-indigo-50 text-indigo-700 border-indigo-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-rose-50 text-rose-700 border-rose-200",
  read: "bg-[var(--wash)] text-[var(--muted)] border-[var(--border)]",
  unread: "bg-blue-50 text-blue-700 border-blue-200",
};

interface StatusBadgeProps {
  status: string;
  label?: string;
  className?: string;
}

export default function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const key = status.toLowerCase();
  const colors = statusColors[key] ?? "bg-[var(--wash)] text-[var(--muted)] border-[var(--border)]";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
        colors,
        className
      )}
    >
      {label ?? status}
    </span>
  );
}
