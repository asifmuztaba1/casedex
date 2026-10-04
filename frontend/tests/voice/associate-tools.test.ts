import { describe, expect, it, vi } from "vitest";
import { createAssociateTools, dhakaDateTime, type AssociateDraft } from "@/features/voice/associate-tools";

const CASE_ID = "01JABCDEFGHJKMNPQRSTVWXYZ0";
const HEARING_ID = "01JHEARING0000000000000000";

const caseDetail = {
  public_id: CASE_ID,
  title: "Rahim v. Karim",
  case_number: "Title Suit 12/2026",
  court: "Joint District Judge, Dhaka",
  status: "open",
  opposite_lawyer_name: null,
  client: { name: "Rahim Uddin" },
  story: "Land boundary dispute.",
  parties: [{ name: "Karim Mia", role: "defendant", side: "opponent" }],
  recent_diary_entries: [{ entry_at: "2026-10-01T10:00", title: "Called client", body: "Asked for the deed." }],
  recent_documents: [{ original_name: "deed.pdf", category: "evidence" }],
};

const hearing = {
  public_id: HEARING_ID,
  case_public_id: CASE_ID,
  case_title: "Rahim v. Karim",
  hearing_at: "2026-10-05T10:30:00",
  type: "hearing",
  location: "Court 3",
  agenda: "Issues framing",
  outcome: null,
};

function setup(routes: Record<string, unknown> = {}) {
  const all: Record<string, unknown> = {
    [`/api/v1/cases/${CASE_ID}`]: { data: caseDetail },
    [`/api/v1/cases/${CASE_ID}/hearings`]: { data: [hearing] },
    ...routes,
  };
  const get = vi.fn(async (path: string) => {
    const key = Object.keys(all).find((route) => path === route || path.startsWith(`${route}?`));
    if (!key) throw new Error("Request failed: 404");
    return all[key];
  });
  const drafts: AssociateDraft[] = [];
  const openCase = vi.fn();
  // 20:00 UTC on 4 October is already 5 October in Dhaka (UTC+6).
  const tools = createAssociateTools({ onDraft: (draft) => drafts.push(draft), openCase, get: get as never, now: () => new Date("2026-10-04T20:00:00Z") });

  return { tools, get, drafts, openCase };
}

describe("voice associate tools", () => {
  it("lists hearings for the Bangladesh date, not the browser's", async () => {
    const { tools, get } = setup({ "/api/v1/hearings/calendar": { data: [hearing] } });

    const today = JSON.parse(await tools.get_hearings({ range: "today" }));
    expect(get).toHaveBeenCalledWith("/api/v1/hearings/calendar?from=2026-10-05&to=2026-10-05");
    expect(today.hearings[0]).toMatchObject({ hearing_public_id: HEARING_ID, case_title: "Rahim v. Karim", court_room: "Court 3" });

    await tools.get_hearings({ range: "week" });
    expect(get).toHaveBeenCalledWith("/api/v1/hearings/calendar?from=2026-10-05&to=2026-10-11");
  });

  it("finds cases with the server search", async () => {
    const { tools, get } = setup({ "/api/v1/cases": { data: [{ ...caseDetail }] } });

    const result = JSON.parse(await tools.find_cases({ query: "Rahim & sons" }));

    expect(get).toHaveBeenCalledWith("/api/v1/cases?search=Rahim%20%26%20sons&per_page=5");
    expect(result.cases).toEqual([
      { case_public_id: CASE_ID, title: "Rahim v. Karim", case_number: "Title Suit 12/2026", court: "Joint District Judge, Dhaka", status: "open", client: "Rahim Uddin" },
    ]);
  });

  it("briefs a case with its parties, hearings and recent notes", async () => {
    const { tools } = setup();

    const brief = JSON.parse(await tools.get_case_brief({ case_public_id: CASE_ID }));

    expect(brief).toMatchObject({ title: "Rahim v. Karim", client: "Rahim Uddin", parties: [{ name: "Karim Mia", role: "defendant" }] });
    expect(brief.hearings[0].hearing_public_id).toBe(HEARING_ID);
    expect(brief.recent_diary[0].title).toBe("Called client");
  });

  it("puts a diary draft on screen and says it is not saved", async () => {
    const { tools, drafts } = setup();

    const result = JSON.parse(await tools.draft_diary_entry({ case_public_id: CASE_ID, title: "Deed", body: "Client brings the deed on Monday." }));

    expect(result).toMatchObject({ saved: false, shown_on_screen: true });
    expect(drafts).toEqual([
      { kind: "diary", id: "draft-1", case_public_id: CASE_ID, case_title: "Rahim v. Karim", title: "Deed", body: "Client brings the deed on Monday." },
    ]);
  });

  it("never drafts for a case it could not find", async () => {
    const { tools, drafts, get } = setup();

    expect(JSON.parse(await tools.draft_diary_entry({ case_public_id: "made-up", title: "x", body: "y" })).error).toContain("Unknown case id");
    expect(get).not.toHaveBeenCalled();
    expect(JSON.parse(await tools.draft_diary_entry({ case_public_id: "01JZZZZZZZZZZZZZZZZZZZZZZZ", title: "x", body: "y" })).error).toContain("not found");
    expect(drafts).toHaveLength(0);
  });

  it("drafts a hearing update only for a hearing in that case, with a proper date", async () => {
    const { tools, drafts } = setup();

    expect(JSON.parse(await tools.draft_hearing_update({ case_public_id: CASE_ID, outcome: "Adjourned" })).error).toContain("Which hearing");
    expect(JSON.parse(await tools.draft_hearing_update({ case_public_id: CASE_ID, hearing_public_id: "01JOTHER00000000000000000X", outcome: "Adjourned" })).error).toContain("not in this case");
    expect(JSON.parse(await tools.draft_hearing_update({ case_public_id: CASE_ID, next_hearing_at: "12 November" })).error).toContain("next_hearing_at");
    expect(drafts).toHaveLength(0);

    await tools.draft_hearing_update({ case_public_id: CASE_ID, hearing_public_id: HEARING_ID, outcome: "Adjourned for affidavit", next_hearing_at: "2026-11-12T10:30" });

    expect(drafts[0]).toMatchObject({
      kind: "hearing",
      hearing_public_id: HEARING_ID,
      hearing_at: "2026-10-05T10:30:00",
      outcome: "Adjourned for affidavit",
      minutes: "",
      next_hearing_at: "2026-11-12T10:30",
    });
  });

  it("opens a case the lawyer can see", async () => {
    const { tools, openCase } = setup();

    await tools.open_case({ case_public_id: CASE_ID });

    expect(openCase).toHaveBeenCalledWith(CASE_ID);
  });

  it("tells the agent when CaseDex cannot load, instead of failing the call", async () => {
    const { tools } = setup();

    const result = JSON.parse(await tools.get_hearings({ range: "today" }));

    expect(result.error).toContain("do not guess");
  });

  it("formats the diary time in Bangladesh", () => {
    expect(dhakaDateTime(new Date("2026-10-04T20:05:00Z"))).toBe("2026-10-05T02:05");
  });
});
