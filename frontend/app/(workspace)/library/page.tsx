"use client";

import { useMemo, useState } from "react";
import PageHeader from "@/components/page-header";
import { useLocale } from "@/components/locale-provider";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Building2,
  ExternalLink,
  Gavel,
  GraduationCap,
  Landmark,
  LibraryBig,
  Scale,
  ScrollText,
  Search,
  ShieldCheck,
} from "lucide-react";

type Resource = {
  titleKey: string;
  descKey: string;
  href: string;
  free: boolean;
};

type Section = {
  id: string;
  titleKey: string;
  descKey: string;
  icon: React.ComponentType<{ className?: string }>;
  resources: Resource[];
};

const SECTIONS: Section[] = [
  {
    id: "statutes",
    titleKey: "library.sec.statutes.title",
    descKey: "library.sec.statutes.desc",
    icon: ScrollText,
    resources: [
      {
        titleKey: "library.r.bdcode.title",
        descKey: "library.r.bdcode.desc",
        href: "http://bdlaws.minlaw.gov.bd/",
        free: true,
      },
      {
        titleKey: "library.r.constitution.title",
        descKey: "library.r.constitution.desc",
        href: "http://bdlaws.minlaw.gov.bd/act-367.html",
        free: true,
      },
      {
        titleKey: "library.r.parliament.title",
        descKey: "library.r.parliament.desc",
        href: "https://www.parliament.gov.bd/",
        free: true,
      },
    ],
  },
  {
    id: "courts",
    titleKey: "library.sec.courts.title",
    descKey: "library.sec.courts.desc",
    icon: Gavel,
    resources: [
      {
        titleKey: "library.r.sc.title",
        descKey: "library.r.sc.desc",
        href: "https://www.supremecourt.gov.bd/",
        free: true,
      },
      {
        titleKey: "library.r.causelist.title",
        descKey: "library.r.causelist.desc",
        href: "https://www.supremecourt.gov.bd/web/?page=causelist.php&menu=10",
        free: true,
      },
      {
        titleKey: "library.r.commonlii.title",
        descKey: "library.r.commonlii.desc",
        href: "http://www.commonlii.org/bd/",
        free: true,
      },
      {
        titleKey: "library.r.asianlii.title",
        descKey: "library.r.asianlii.desc",
        href: "http://www.asianlii.org/bd/",
        free: true,
      },
    ],
  },
  {
    id: "government",
    titleKey: "library.sec.government.title",
    descKey: "library.sec.government.desc",
    icon: Landmark,
    resources: [
      {
        titleKey: "library.r.minlaw.title",
        descKey: "library.r.minlaw.desc",
        href: "https://minlaw.gov.bd/",
        free: true,
      },
      {
        titleKey: "library.r.lawcommission.title",
        descKey: "library.r.lawcommission.desc",
        href: "http://lawcommissionbangladesh.org/",
        free: true,
      },
      {
        titleKey: "library.r.ago.title",
        descKey: "library.r.ago.desc",
        href: "https://ag.gov.bd/",
        free: true,
      },
    ],
  },
  {
    id: "legalaid",
    titleKey: "library.sec.legalaid.title",
    descKey: "library.sec.legalaid.desc",
    icon: ShieldCheck,
    resources: [
      {
        titleKey: "library.r.nlaso.title",
        descKey: "library.r.nlaso.desc",
        href: "https://nlaso.gov.bd/",
        free: true,
      },
      {
        titleKey: "library.r.ask.title",
        descKey: "library.r.ask.desc",
        href: "https://www.askbd.org/",
        free: true,
      },
      {
        titleKey: "library.r.blast.title",
        descKey: "library.r.blast.desc",
        href: "https://www.blast.org.bd/",
        free: true,
      },
    ],
  },
  {
    id: "bar",
    titleKey: "library.sec.bar.title",
    descKey: "library.sec.bar.desc",
    icon: Scale,
    resources: [
      {
        titleKey: "library.r.barcouncil.title",
        descKey: "library.r.barcouncil.desc",
        href: "http://www.barcouncil.gov.bd/",
        free: true,
      },
      {
        titleKey: "library.r.scba.title",
        descKey: "library.r.scba.desc",
        href: "https://www.supremecourt.gov.bd/",
        free: true,
      },
    ],
  },
  {
    id: "academic",
    titleKey: "library.sec.academic.title",
    descKey: "library.sec.academic.desc",
    icon: GraduationCap,
    resources: [
      {
        titleKey: "library.r.dulaw.title",
        descKey: "library.r.dulaw.desc",
        href: "https://www.du.ac.bd/academic/department_item/LAW",
        free: true,
      },
      {
        titleKey: "library.r.bracu.title",
        descKey: "library.r.bracu.desc",
        href: "https://sls.bracu.ac.bd/",
        free: true,
      },
      {
        titleKey: "library.r.nuj.title",
        descKey: "library.r.nuj.desc",
        href: "https://www.nu.ac.bd/",
        free: true,
      },
    ],
  },
  {
    id: "international",
    titleKey: "library.sec.international.title",
    descKey: "library.sec.international.desc",
    icon: Building2,
    resources: [
      {
        titleKey: "library.r.worldlii.title",
        descKey: "library.r.worldlii.desc",
        href: "http://www.worldlii.org/",
        free: true,
      },
      {
        titleKey: "library.r.unbd.title",
        descKey: "library.r.unbd.desc",
        href: "https://bangladesh.un.org/",
        free: true,
      },
    ],
  },
  {
    id: "reference",
    titleKey: "library.sec.reference.title",
    descKey: "library.sec.reference.desc",
    icon: BookOpen,
    resources: [
      {
        titleKey: "library.r.banglapedia.title",
        descKey: "library.r.banglapedia.desc",
        href: "https://en.banglapedia.org/",
        free: true,
      },
      {
        titleKey: "library.r.dhakalawreports.title",
        descKey: "library.r.dhakalawreports.desc",
        href: "https://www.dhakalawreports.com/",
        free: false,
      },
    ],
  },
];

export default function LibraryPage() {
  const { t } = useLocale();
  const [query, setQuery] = useState("");

  const filteredSections = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SECTIONS;
    return SECTIONS.map((section) => ({
      ...section,
      resources: section.resources.filter((r) => {
        const title = t(r.titleKey).toLowerCase();
        const desc = t(r.descKey).toLowerCase();
        return title.includes(q) || desc.includes(q);
      }),
    })).filter((s) => s.resources.length > 0);
  }, [query, t]);

  const totalCount = SECTIONS.reduce((sum, s) => sum + s.resources.length, 0);

  return (
    <section className="space-y-6">
      <PageHeader
        title={t("library.title")}
        description={t("library.description")}
      />

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[var(--wash)] to-[var(--paper)] p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500">
          <LibraryBig className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[var(--foreground)]">
            {t("library.banner.title")}
          </p>
          <p className="text-xs text-[var(--muted)]">
            {t("library.banner.subtitle").replace(
              "{count}",
              String(totalCount)
            )}
          </p>
        </div>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-soft)]" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("library.search_placeholder")}
          className="pl-9"
        />
      </div>

      {filteredSections.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-[var(--muted)]">
            {t("library.empty")}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {filteredSections.map((section) => {
            const Icon = section.icon;
            return (
              <div key={section.id} className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--wash)] text-[var(--foreground)]">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-[var(--foreground)]">
                      {t(section.titleKey)}
                    </h2>
                    <p className="text-xs text-[var(--muted-soft)]">
                      {t(section.descKey)}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {section.resources.map((r) => (
                    <a
                      key={r.href}
                      href={r.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group rounded-xl border border-[var(--border)] bg-[var(--paper)] p-4 transition-colors hover:border-indigo-400 hover:bg-[var(--paper-hover)]"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="truncate text-sm font-semibold text-[var(--foreground)] group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                              {t(r.titleKey)}
                            </h3>
                            {r.free ? (
                              <Badge variant="subtle" className="shrink-0">
                                {t("library.free")}
                              </Badge>
                            ) : (
                              <Badge className="shrink-0">
                                {t("library.paid")}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs leading-relaxed text-[var(--muted)]">
                            {t(r.descKey)}
                          </p>
                          <p className="truncate text-[11px] text-[var(--muted-soft)]">
                            {new URL(r.href).hostname}
                          </p>
                        </div>
                        <ExternalLink className="h-4 w-4 shrink-0 text-[var(--muted-soft)] group-hover:text-indigo-500" />
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--wash)] px-4 py-3 text-xs text-[var(--muted)]">
        {t("library.disclaimer")}
      </p>
    </section>
  );
}
