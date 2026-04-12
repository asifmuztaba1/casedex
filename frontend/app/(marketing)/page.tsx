"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  ArrowRight,
  CalendarClock,
  FileText,
  Scale,
  ShieldCheck,
  Sparkles,
  Users,
  WifiOff,
} from "lucide-react";
import { useLocale } from "@/components/locale-provider";
import PlanTierCard from "@/components/plan-tier-card";
import { PLAN_CATALOG } from "@/features/billing/plan-catalog";

export default function Home() {
  const { t } = useLocale();
  const signalCards = [
    {
      label: t("home.signal.label1"),
      title: t("home.preview.next_hearing"),
      meta: t("home.signal.meta1"),
    },
    {
      label: t("home.signal.label2"),
      title: t("case.detail.tabs.diary"),
      meta: t("home.signal.meta2"),
    },
    {
      label: t("home.signal.label3"),
      title: t("case.detail.tabs.documents"),
      meta: t("home.signal.meta3"),
    },
    {
      label: t("home.signal.label4"),
      title: t("home.cards.team"),
      meta: t("home.signal.meta4"),
    },
  ];

  return (
    <section className="space-y-16 md:space-y-24">
      <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12">
        <div className="space-y-6 md:space-y-8">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="subtle">{t("home.badge.workspace")}</Badge>
            <Badge variant="subtle">{t("home.badge.sources")}</Badge>
          </div>
          <div className="space-y-4 md:space-y-6">
            <p className="text-xs uppercase tracking-[0.4em] text-[var(--muted-soft)]">
              {t("home.hero.kicker")}
            </p>
            <h1 className="text-3xl font-semibold leading-tight text-[var(--foreground)] sm:text-4xl md:text-5xl lg:text-6xl">
              {t("home.hero.title")}
            </h1>
            <p className="text-base text-[var(--muted)] md:text-lg">
              {t("home.hero.subtitle")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="lg" asChild>
              <a href="/register" className="inline-flex items-center gap-2">
                {t("home.cta.start")}
                <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <a href="/features">{t("home.cta.demo")}</a>
            </Button>
            <Button variant="ghost" size="lg" asChild className="hidden sm:inline-flex">
              <a href="/login">{t("home.cta.login")}</a>
            </Button>
          </div>
          <div className="grid gap-3 text-sm text-[var(--muted)] sm:grid-cols-3 sm:gap-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 shrink-0 text-[var(--muted-soft)]" />
              {t("home.trust.tenant")}
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 shrink-0 text-[var(--muted-soft)]" />
              {t("home.trust.ai")}
            </div>
            <div className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 shrink-0 text-[var(--muted-soft)]" />
              {t("home.trust.pwa")}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {signalCards.map((card) => (
            <div
              key={card.title}
              className="rounded-2xl border border-[var(--border)] bg-[var(--paper)] px-5 py-4 shadow-sm"
            >
              <div className="text-xs uppercase tracking-[0.3em] text-[var(--muted-soft)]">
                {card.label}
              </div>
              <div className="mt-2 text-base font-semibold text-[var(--foreground)]">
                {card.title}
              </div>
              <div className="text-xs text-[var(--muted-soft)]">{card.meta}</div>
            </div>
          ))}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--wash)] px-5 py-4 text-sm text-[var(--muted)]">
            {t("home.signal.note")}
          </div>
        </div>
      </div>

      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-8">
        <div className="space-y-6">
          <p className="text-xs uppercase tracking-[0.4em] text-[var(--muted-soft)]">
            {t("home.signal.title")}
          </p>
          <h2 className="text-3xl font-semibold text-[var(--foreground)]">
            {t("home.signal.subtitle")}
          </h2>
          <p className="text-sm text-[var(--muted)]">
            {t("home.signal.body")}
          </p>
          <div className="grid gap-3">
            {[
              t("home.signal.item1"),
              t("home.signal.item2"),
              t("home.signal.item3"),
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--paper)] px-4 py-3 text-sm text-[var(--muted)]"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--foreground)]" />
                {item}
              </div>
            ))}
          </div>
        </div>
        <Card className="border-[var(--border)] shadow-sm">
          <CardHeader className="border-b border-[var(--border)]">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted-soft)]">
                  {t("home.preview.kicker")}
                </p>
                <CardTitle className="text-xl">{t("home.preview.title")}</CardTitle>
                <CardDescription>
                  {t("home.preview.subtitle")}
                </CardDescription>
              </div>
              <Badge variant="subtle">{t("home.preview.badge")}</Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 py-6">
            {[
              {
                title: t("home.preview.next_hearing"),
                body: t("home.preview.item1.body"),
                icon: CalendarClock,
              },
              {
                title: t("home.preview.diary_focus"),
                body: t("home.preview.item2.body"),
                icon: FileText,
              },
              {
                title: t("home.preview.recent_document"),
                body: t("home.preview.item3.body"),
                icon: FileText,
              },
            ].map((item) => (
              <div
                key={item.title}
                className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--wash)] px-4 py-3"
              >
                <item.icon className="h-4 w-4 text-[var(--muted-soft)]" />
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-soft)]">
                    {item.title}
                  </div>
                  <div className="text-sm text-[var(--foreground)]">{item.body}</div>
                </div>
              </div>
            ))}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--paper)] px-4 py-4 text-sm text-[var(--muted)]">
              {t("home.preview.ai_note")}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {[
          {
            title: t("home.cards.case"),
            description:
              t("home.cards.case_desc"),
            icon: FileText,
          },
          {
            title: t("home.cards.hearing"),
            description:
              t("home.cards.hearing_desc"),
            icon: CalendarClock,
          },
          {
            title: t("home.cards.team"),
            description:
              t("home.cards.team_desc"),
            icon: Users,
          },
        ].map((item) => (
          <Card key={item.title} className="h-full">
            <CardHeader className="space-y-3">
              <item.icon className="h-5 w-5 text-[var(--muted-soft)]" />
              <CardTitle className="text-lg">{item.title}</CardTitle>
              <CardDescription>{item.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[var(--muted-soft)]">
            {t("home.workflow.kicker")}
          </p>
          <CardTitle className="text-2xl font-semibold">
            {t("home.workflow.title")}
          </CardTitle>
          <CardDescription>
            {t("home.workflow.subtitle")}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-3">
          {[
            {
              step: "01",
              title: t("home.workflow.step1.title"),
              description: t("home.workflow.step1.desc"),
            },
            {
              step: "02",
              title: t("home.workflow.step2.title"),
              description: t("home.workflow.step2.desc"),
            },
            {
              step: "03",
              title: t("home.workflow.step3.title"),
              description: t("home.workflow.step3.desc"),
            },
          ].map((item) => (
            <div key={item.step} className="space-y-3">
              <Badge variant="subtle">Step {item.step}</Badge>
              <div className="text-base font-semibold text-[var(--foreground)]">
                {item.title}
              </div>
              <p className="text-sm text-[var(--muted)]">{item.description}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[var(--muted-soft)]">
            Plans
          </p>
          <CardTitle className="text-2xl font-semibold">
            Choose a package based on storage and support
          </CardTitle>
          <CardDescription>
            Unlimited cases and team members are included in every plan. Upgrade by storage and service level.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-3">
          {PLAN_CATALOG.map((plan) => (
            <PlanTierCard
              key={plan.id}
              plan={plan}
              interval="monthly"
              featured={plan.id === "professional"}
              ctaLabel="Start with this plan"
              ctaHref={`/register?plan=${plan.id}&interval=monthly`}
            />
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="space-y-3">
            <Scale className="h-5 w-5 text-[var(--muted-soft)]" />
            <CardTitle className="text-lg">{t("home.bd_courts_title")}</CardTitle>
            <CardDescription>{t("home.bd_courts_desc")}</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="space-y-3">
            <WifiOff className="h-5 w-5 text-[var(--muted-soft)]" />
            <CardTitle className="text-lg">{t("home.offline_title")}</CardTitle>
            <CardDescription>{t("home.offline_desc")}</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[var(--muted-soft)]">
            {t("home.security.kicker")}
          </p>
          <CardTitle className="text-2xl font-semibold">
            {t("home.security.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {[
            t("home.security.item1"),
            t("home.security.item2"),
            t("home.security.item3"),
            t("home.security.item4"),
          ].map((item) => (
            <div
              key={item}
              className="flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--wash)] px-4 py-3 text-sm text-[var(--muted)]"
            >
              <ShieldCheck className="h-4 w-4 text-[var(--muted-soft)]" />
              {item}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-6 md:grid-cols-[1.2fr_0.8fr] md:items-center">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[var(--muted-soft)]">
              {t("home.cta.kicker")}
            </p>
            <h2 className="text-xl font-semibold text-[var(--foreground)] md:text-2xl">
              {t("home.cta.title")}
            </h2>
            <p className="text-sm text-[var(--muted)]">
              {t("home.cta.subtitle")}
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Input placeholder={t("home.cta.email")} type="email" />
            <Button className="w-full sm:w-auto">{t("home.cta.button")}</Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
