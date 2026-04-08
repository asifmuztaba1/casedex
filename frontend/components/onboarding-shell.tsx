"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Step = "account" | "plan" | "payment";

const STEPS: Array<{ id: Step; label: string; href: string }> = [
  { id: "account", label: "Account", href: "/onboarding/account" },
  { id: "plan", label: "Package", href: "/onboarding/plan" },
  { id: "payment", label: "Payment", href: "/onboarding/payment" },
];

export default function OnboardingShell({
  step,
  title,
  description,
  children,
}: {
  step: Step;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="mx-auto w-full max-w-5xl space-y-6 pb-12">
      <div className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-gradient-to-br from-[var(--paper)] via-[var(--wash)] to-blue-50 p-6 shadow-sm md:p-8">
        <div className="pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full bg-blue-100/70 blur-2xl" />
        <div className="pointer-events-none absolute -left-14 -bottom-14 h-40 w-40 rounded-full bg-teal-100/70 blur-2xl" />
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--muted-soft)]">Onboarding</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--foreground)]">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">{description}</p>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          {STEPS.map((item, index) => {
            const active = item.id === step;
            return (
              <div key={item.id} className="flex items-center gap-2">
                <Link href={item.href}>
                  <Badge className={cn(active && "bg-[var(--foreground)] text-white border-[var(--foreground)]", "cursor-pointer")}>{index + 1}. {item.label}</Badge>
                </Link>
                {index < STEPS.length - 1 ? <span className="text-[var(--muted-soft)]">/</span> : null}
              </div>
            );
          })}
        </div>
      </div>
      {children}
    </section>
  );
}
