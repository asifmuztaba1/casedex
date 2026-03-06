"use client";

import { cn } from "@/lib/utils";

type StorageMeterProps = {
  usedBytes: number;
  limitBytes: number | null;
  hasUnlimitedStorage?: boolean;
  className?: string;
};

function formatBytes(bytes: number): string {
  if (bytes <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );
  const value = bytes / 1024 ** exponent;

  return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

export default function StorageMeter({
  usedBytes,
  limitBytes,
  hasUnlimitedStorage = false,
  className,
}: StorageMeterProps) {
  if (hasUnlimitedStorage || limitBytes === null) {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">Storage</span>
          <span className="font-medium text-slate-900">Unlimited</span>
        </div>
        <div className="h-2 rounded-full bg-emerald-100" />
      </div>
    );
  }

  const ratio = limitBytes > 0 ? Math.min(1, usedBytes / limitBytes) : 0;
  const percentage = Math.round(ratio * 100);
  const tone =
    ratio >= 0.9
      ? "bg-rose-500"
      : ratio >= 0.7
        ? "bg-amber-500"
        : "bg-emerald-500";

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-600">Storage</span>
        <span className="font-medium text-slate-900">
          {formatBytes(usedBytes)} / {formatBytes(limitBytes)}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
        <div className={cn("h-full transition-all", tone)} style={{ width: `${percentage}%` }} />
      </div>
      <div className="text-xs text-slate-500">{percentage}% used</div>
    </div>
  );
}
