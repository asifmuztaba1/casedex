import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";

export type DailyBriefingFirstHearing = {
  at: string | null;
  case_title: string | null;
  case_public_id: string | null;
  court: string | null;
};

export type DailyBriefing = {
  date: string;
  hearings_today: number;
  first_hearing: DailyBriefingFirstHearing | null;
  pending_outcomes_yesterday: number;
  document_deadlines_today: number;
  cause_list_matches_today: number;
  has_any: boolean;
};

type DailyBriefingResponse = {
  data: DailyBriefing;
};

export function useDailyBriefing(enabled = true) {
  return useQuery({
    queryKey: ["daily-briefing", "today"],
    queryFn: () =>
      apiGet<DailyBriefingResponse>("/api/v1/daily-briefing/today"),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
