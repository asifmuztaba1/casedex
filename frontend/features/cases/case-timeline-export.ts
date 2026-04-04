import type {
  CaseDetail,
  CaseParticipantSummary,
  CasePartySummary,
} from "@/features/cases/use-cases";
import type { DiaryEntrySummary } from "@/features/diary/use-diary-entries";
import type { DocumentSummary } from "@/features/documents/use-documents";
import type { HearingSummary } from "@/features/hearings/use-hearings";
import type { Locale } from "@/lib/locale-constants";

type Translator = (key: string) => string;

type DownloadCaseTimelineExportArgs = {
  locale: Locale;
  t: Translator;
  caseDetail: CaseDetail;
  hearings: HearingSummary[];
  diaryEntries: DiaryEntrySummary[];
  documents: DocumentSummary[];
  participants: CaseParticipantSummary[];
  parties: CasePartySummary[];
};

type TimelineEntry = {
  sortAt: string | null;
  title: string;
  detail: string[];
};

function formatDateTime(locale: Locale, value: string | null): string {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat(locale === "bn" ? "bn-BD" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatDate(locale: Locale, value: string | null): string {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat(locale === "bn" ? "bn-BD" : "en-US", {
    dateStyle: "medium",
  }).format(date);
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function joinLines(lines: Array<string | null | undefined>): string[] {
  return lines
    .map((line) => line?.trim())
    .filter((line): line is string => Boolean(line));
}

function buildTimelineEntries({
  t,
  hearings,
  diaryEntries,
  documents,
}: Pick<
  DownloadCaseTimelineExportArgs,
  "t" | "hearings" | "diaryEntries" | "documents"
>): TimelineEntry[] {
  const items: TimelineEntry[] = [];

  hearings.forEach((hearing) => {
    items.push({
      sortAt: hearing.hearing_at ?? hearing.created_at ?? null,
      title: `${t("case.timeline.event.hearing")}: ${
        hearing.type ? t(`hearing.type.${hearing.type}`) : t("hearing.type.hearing")
      }`,
      detail: joinLines([
        hearing.agenda
          ? `${t("hearing.agenda")}: ${hearing.agenda}`
          : null,
        hearing.location
          ? `${t("case.detail.location_placeholder")}: ${hearing.location}`
          : null,
        hearing.outcome
          ? `${t("hearing.outcome")}: ${hearing.outcome}`
          : null,
        hearing.minutes
          ? `${t("hearing.minutes")}: ${hearing.minutes}`
          : null,
        hearing.next_steps
          ? `${t("hearing.next_steps")}: ${hearing.next_steps}`
          : null,
      ]),
    });
  });

  diaryEntries.forEach((entry) => {
    items.push({
      sortAt: entry.entry_at ?? entry.created_at ?? null,
      title: `${t("case.timeline.event.diary")}: ${
        entry.title ?? t("case.detail.tabs.diary")
      }`,
      detail: joinLines([entry.body]),
    });
  });

  documents.forEach((document) => {
    items.push({
      sortAt: document.created_at ?? null,
      title: `${t("case.timeline.event.document")}: ${
        document.original_name ?? t("table.document")
      }`,
      detail: joinLines([
        document.category
          ? `${t("table.category")}: ${t(`document.category.${document.category}`)}`
          : null,
        document.mime ? `${t("case.timeline.mime")}: ${document.mime}` : null,
        typeof document.size === "number"
          ? `${t("case.timeline.size")}: ${document.size} bytes`
          : null,
      ]),
    });
  });

  return items.sort((left, right) => {
    const leftValue = left.sortAt ? new Date(left.sortAt).getTime() : Number.MAX_SAFE_INTEGER;
    const rightValue = right.sortAt ? new Date(right.sortAt).getTime() : Number.MAX_SAFE_INTEGER;
    return leftValue - rightValue;
  });
}

function buildMarkdown({
  locale,
  t,
  caseDetail,
  hearings,
  diaryEntries,
  documents,
  participants,
  parties,
}: DownloadCaseTimelineExportArgs): string {
  const exportedAt = new Date().toISOString();
  const timelineEntries = buildTimelineEntries({
    t,
    hearings,
    diaryEntries,
    documents,
  });

  const sections: string[] = [];

  sections.push(`# ${caseDetail.title}`);
  sections.push("");
  sections.push(`${t("case.timeline.generated_at")}: ${formatDateTime(locale, exportedAt)}`);
  sections.push(`${t("case.timeline.court")}: ${caseDetail.court ?? "-"}`);
  sections.push(`${t("case.timeline.case_number")}: ${caseDetail.case_number ?? "-"}`);
  sections.push(
    `${t("case.timeline.status")}: ${
      caseDetail.status ? t(`case.status.${caseDetail.status}`) : t("case.status.open")
    }`
  );
  sections.push(`${t("case.timeline.created_at")}: ${formatDate(locale, caseDetail.created_at)}`);
  sections.push("");

  sections.push(`## ${t("case.timeline.client")}`);
  sections.push(caseDetail.client?.name ?? "-");
  if (caseDetail.client?.phone) {
    sections.push(`${t("cases.client.phone")}: ${caseDetail.client.phone}`);
  }
  if (caseDetail.client?.email) {
    sections.push(`${t("cases.client.email")}: ${caseDetail.client.email}`);
  }
  if (caseDetail.client?.address) {
    sections.push(`${t("cases.client.address")}: ${caseDetail.client.address}`);
  }
  sections.push("");

  sections.push(`## ${t("case.timeline.story")}`);
  sections.push(caseDetail.story?.trim() || "-");
  sections.push("");

  sections.push(`## ${t("case.timeline.petition")}`);
  sections.push(caseDetail.petition_draft?.trim() || "-");
  sections.push("");

  sections.push(`## ${t("case.timeline.team")}`);
  if (participants.length === 0) {
    sections.push("-");
  } else {
    participants.forEach((participant) => {
      sections.push(
        `- ${participant.user?.name ?? t("common.user")} (${
          participant.role ? t(`roles.${participant.role}`) : "-"
        })`
      );
    });
  }
  sections.push("");

  sections.push(`## ${t("case.timeline.parties")}`);
  if (parties.length === 0) {
    sections.push("-");
  } else {
    parties.forEach((party) => {
      sections.push(
        `- ${party.name} ${
          party.role ? `(${t(`party.role.${party.role}`)})` : ""
        }`.trim()
      );
    });
  }
  sections.push("");

  sections.push(`## ${t("case.timeline.timeline")}`);
  if (timelineEntries.length === 0) {
    sections.push(`- ${t("case.timeline.empty")}`);
  } else {
    timelineEntries.forEach((entry) => {
      sections.push(
        `### ${formatDateTime(locale, entry.sortAt)} · ${entry.title}`
      );
      if (entry.detail.length === 0) {
        sections.push("-");
      } else {
        entry.detail.forEach((line) => {
          sections.push(`- ${line}`);
        });
      }
      sections.push("");
    });
  }

  return sections.join("\n").trimEnd() + "\n";
}

export function downloadCaseTimelineExport(
  args: DownloadCaseTimelineExportArgs
): string {
  const filenameBase = slugify(args.caseDetail.title || "case-timeline") || "case-timeline";
  const filename = `${filenameBase}-timeline.md`;
  const content = buildMarkdown(args);
  const blob = new Blob([content], {
    type: "text/markdown;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  return filename;
}
