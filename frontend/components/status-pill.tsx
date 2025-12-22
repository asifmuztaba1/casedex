type StatusPillProps = {
  label: string;
};

export default function StatusPill({ label }: StatusPillProps) {
  return (
    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
      {label}
    </span>
  );
}
