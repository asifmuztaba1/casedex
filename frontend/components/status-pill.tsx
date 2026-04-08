type StatusPillProps = {
  label: string;
};

export default function StatusPill({ label }: StatusPillProps) {
  return (
    <span className="rounded-full bg-[var(--wash)] px-3 py-1 text-xs font-medium text-[var(--muted)]">
      {label}
    </span>
  );
}
