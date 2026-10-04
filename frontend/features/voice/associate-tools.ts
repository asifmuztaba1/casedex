import { apiGet } from "@/lib/api-client";
import type { CaseDetail, CaseSummary } from "@/features/cases/use-cases";
import type { HearingSummary } from "@/features/hearings/use-hearings";

/**
 * The client tools the voice associate can call. They read through the same
 * API (and permissions) as the rest of the app. The draft tools only put a
 * draft on screen: nothing is saved until the lawyer confirms it there.
 */

export type DiaryDraft = {
  kind: "diary";
  id: string;
  case_public_id: string;
  case_title: string;
  title: string;
  body: string;
};

export type HearingDraft = {
  kind: "hearing";
  id: string;
  case_public_id: string;
  case_title: string;
  hearing_public_id: string | null;
  hearing_at: string | null;
  outcome: string;
  minutes: string;
  next_hearing_at: string;
};

export type AssociateDraft = DiaryDraft | HearingDraft;

type Params = Record<string, unknown>;
export type AssociateTools = Record<string, (params: Params) => Promise<string>>;

type Deps = {
  onDraft: (draft: AssociateDraft) => void;
  openCase: (casePublicId: string) => void;
  get?: <T>(path: string) => Promise<T>;
  now?: () => Date;
};

const PUBLIC_ID = /^[0-9A-HJKMNP-TV-Z]{26}$/i;
const LOCAL_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

/** YYYY-MM-DD in Bangladesh, where the courts are. */
export function dhakaDate(now: Date, offsetDays = 0): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(now.getTime() + offsetDays * 86_400_000));
}

/** YYYY-MM-DDTHH:MM in Bangladesh, the format the diary and hearing forms send. */
export function dhakaDateTime(now: Date): string {
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Dhaka",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(now);
  return `${dhakaDate(now)}T${time}`;
}

function text(params: Params, key: string, max = 5000): string {
  const value = params[key];
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function reply(value: unknown): string {
  return JSON.stringify(value);
}

function hearingLine(hearing: HearingSummary) {
  return {
    hearing_public_id: hearing.public_id,
    case_public_id: hearing.case_public_id ?? null,
    case_title: hearing.case_title ?? null,
    at: hearing.hearing_at,
    type: hearing.type,
    court_room: hearing.location,
    agenda: hearing.agenda,
    outcome: hearing.outcome,
  };
}

export function createAssociateTools({ onDraft, openCase, get = apiGet, now = () => new Date() }: Deps): AssociateTools {
  let draftCount = 0;

  /** Loads a case the lawyer can see, or explains why not, so the agent never works from an invented id. */
  const loadCase = async (params: Params): Promise<CaseDetail | string> => {
    const id = text(params, "case_public_id", 40);
    if (!PUBLIC_ID.test(id)) {
      return reply({ error: "Unknown case id. Use find_cases or get_hearings to get the case_public_id." });
    }
    try {
      return (await get<{ data: CaseDetail }>(`/api/v1/cases/${id}`)).data;
    } catch {
      return reply({ error: "That case was not found in this workspace." });
    }
  };

  const safely =
    (tool: (params: Params) => Promise<string>) =>
    async (params: Params): Promise<string> => {
      try {
        return await tool(params ?? {});
      } catch {
        return reply({ error: "CaseDex could not load that just now. Tell the lawyer and do not guess." });
      }
    };

  return {
    get_hearings: safely(async (params) => {
      const range = text(params, "range", 10);
      const [from, to] =
        range === "tomorrow"
          ? [dhakaDate(now(), 1), dhakaDate(now(), 1)]
          : range === "week"
            ? [dhakaDate(now()), dhakaDate(now(), 6)]
            : [dhakaDate(now()), dhakaDate(now())];
      const { data } = await get<{ data: HearingSummary[] }>(`/api/v1/hearings/calendar?from=${from}&to=${to}`);

      return reply({ from, to, count: data.length, hearings: data.slice(0, 25).map(hearingLine) });
    }),

    find_cases: safely(async (params) => {
      const query = text(params, "query", 100);
      if (!query) return reply({ error: "Say what to search for, e.g. a party name." });
      const { data } = await get<{ data: CaseSummary[] }>(`/api/v1/cases?search=${encodeURIComponent(query)}&per_page=5`);

      return reply({
        cases: data.map((item) => ({
          case_public_id: item.public_id,
          title: item.title,
          case_number: item.case_number,
          court: item.court,
          status: item.status,
          client: item.client?.name ?? null,
        })),
      });
    }),

    get_case_brief: safely(async (params) => {
      const found = await loadCase(params);
      if (typeof found === "string") return found;
      const { data: hearings } = await get<{ data: HearingSummary[] }>(`/api/v1/cases/${found.public_id}/hearings`);

      return reply({
        case_public_id: found.public_id,
        title: found.title,
        case_number: found.case_number,
        court: found.court,
        status: found.status,
        client: found.client?.name ?? null,
        opposite_lawyer: found.opposite_lawyer_name,
        parties: found.parties.map((party) => ({ name: party.name, role: party.role, side: party.side })),
        story: found.story?.slice(0, 1500) ?? null,
        hearings: hearings.slice(0, 8).map(hearingLine),
        recent_diary: found.recent_diary_entries.slice(0, 3).map((entry) => ({
          at: entry.entry_at,
          title: entry.title,
          note: entry.body?.slice(0, 400) ?? null,
        })),
        recent_documents: found.recent_documents.slice(0, 5).map((doc) => ({ name: doc.original_name, category: doc.category })),
      });
    }),

    draft_diary_entry: safely(async (params) => {
      const found = await loadCase(params);
      if (typeof found === "string") return found;
      const title = text(params, "title", 200);
      const body = text(params, "body");
      if (!title || !body) return reply({ error: "A diary draft needs a title and the note." });

      onDraft({ kind: "diary", id: `draft-${++draftCount}`, case_public_id: found.public_id, case_title: found.title, title, body });

      return reply({ ok: true, shown_on_screen: true, saved: false, note: "The lawyer must confirm it on screen before it is saved." });
    }),

    draft_hearing_update: safely(async (params) => {
      const found = await loadCase(params);
      if (typeof found === "string") return found;
      const outcome = text(params, "outcome");
      const minutes = text(params, "minutes");
      const nextAt = text(params, "next_hearing_at", 16);
      const hearingId = text(params, "hearing_public_id", 40);

      if (nextAt && !LOCAL_DATE_TIME.test(nextAt)) {
        return reply({ error: "next_hearing_at must look like 2026-11-12T10:30. Ask the lawyer for the date and time." });
      }
      if (!outcome && !minutes && !nextAt) {
        return reply({ error: "Nothing to update. Ask what happened or the next date." });
      }

      let hearing: HearingSummary | null = null;
      if (hearingId) {
        const { data: hearings } = await get<{ data: HearingSummary[] }>(`/api/v1/cases/${found.public_id}/hearings`);
        hearing = hearings.find((item) => item.public_id === hearingId) ?? null;
        if (!hearing) return reply({ error: "That hearing is not in this case. Use get_case_brief to see its hearings." });
      } else if (outcome || minutes) {
        return reply({ error: "Which hearing is this about? Use get_case_brief to find the hearing_public_id." });
      }

      onDraft({
        kind: "hearing",
        id: `draft-${++draftCount}`,
        case_public_id: found.public_id,
        case_title: found.title,
        hearing_public_id: hearing?.public_id ?? null,
        hearing_at: hearing?.hearing_at ?? null,
        outcome,
        minutes,
        next_hearing_at: nextAt,
      });

      return reply({ ok: true, shown_on_screen: true, saved: false, note: "The lawyer must confirm it on screen before it is saved." });
    }),

    open_case: safely(async (params) => {
      const found = await loadCase(params);
      if (typeof found === "string") return found;
      openCase(found.public_id);

      return reply({ ok: true, opened: found.title });
    }),
  };
}
