import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";
import type { HearingSummary } from "./use-hearings";

type CalendarHearingsResponse = {
  data: HearingSummary[];
};

type CalendarParams = {
  from: string;
  to: string;
  userPublicId?: string | null;
};

export function useCalendarHearings(params: CalendarParams, enabled = true) {
  const searchParams = new URLSearchParams({ from: params.from, to: params.to });
  if (params.userPublicId) searchParams.set("user_public_id", params.userPublicId);

  return useQuery({
    queryKey: ["hearings", "calendar", params.from, params.to, params.userPublicId ?? "all"],
    queryFn: () => apiGet<CalendarHearingsResponse>(`/api/v1/hearings/calendar?${searchParams}`),
    enabled,
  });
}
