import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";

export type CaseSummary = {
  public_id: string;
  title: string;
  status: string | null;
  reference: string | null;
  summary: string | null;
  created_at: string;
};

type CaseListResponse = {
  data: CaseSummary[];
};

export function useCases() {
  return useQuery({
    queryKey: ["cases"],
    queryFn: () => apiGet<CaseListResponse>("/api/v1/cases"),
  });
}
