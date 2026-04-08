"use client";

import type { Locale } from "@/lib/locale-constants";
import { cn } from "@/lib/utils";
import type { LocalizedTemplate } from "@/features/templates/legal-templates";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type TemplatePresetPickerProps<T> = {
  title: string;
  description: string;
  locale: Locale;
  templates: LocalizedTemplate<T>[];
  onSelect: (payload: T) => void;
  className?: string;
};

export default function TemplatePresetPicker<T>({
  title,
  description,
  locale,
  templates,
  onSelect,
  className,
}: TemplatePresetPickerProps<T>) {
  if (templates.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "rounded-2xl border border-[var(--border)] bg-[var(--wash)]/80 p-4",
        className
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="text-sm font-semibold text-[var(--foreground)]">{title}</div>
          <p className="text-xs text-[var(--muted)]">{description}</p>
        </div>
        <Badge variant="subtle">
          {locale === "bn" ? "টেমপ্লেট" : "Templates"}
        </Badge>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {templates.map((template) => (
          <Button
            key={template.id}
            type="button"
            variant="outline"
            size="sm"
            className="bg-[var(--paper)]"
            onClick={() => onSelect(template.payload[locale])}
          >
            {template.label[locale]}
          </Button>
        ))}
      </div>
    </div>
  );
}
