import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";

export type DailyRegisterHearing = {
  public_id: string;
  case_public_id: string | null;
  case_title: string | null;
  case_number: string | null;
  registry_case_type_bn: string | null;
  court: string | null;
  hearing_at: string | null;
  type: string | null;
  agenda: string | null;
  location: string | null;
  outcome: string | null;
  next_steps: string | null;
  client_name: string | null;
  opponent_name: string | null;
};

type DailyRegisterResponse = {
  data: DailyRegisterHearing[];
};

export function useDailyRegister(date: string) {
  return useQuery({
    queryKey: ["daily-register", date],
    queryFn: () =>
      apiGet<DailyRegisterResponse>(
        `/api/v1/hearings/daily-register?date=${date}`,
      ),
    enabled: Boolean(date),
  });
}
