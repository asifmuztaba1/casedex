"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";

export type CourtLookup = {
  public_id: string;
  name: string;
  name_bn: string;
  country_id: number;
  division?: {
    public_id: string;
    name: string;
    name_bn: string;
  };
  district?: {
    public_id: string;
    name: string;
    name_bn: string;
  };
  court_type?: {
    public_id: string;
    name: string;
    name_bn: string;
  };
};

type CourtLookupResponse = {
  data: CourtLookup[];
};

function buildQuery(params: Record<string, string | undefined>) {
  const query = Object.entries(params)
    .filter(([, value]) => value)
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`
    )
    .join("&");

  return query ? `?${query}` : "";
}

export function useCourtLookup(
  search: string,
  countryCode?: string,
  enabled = true
) {
  const trimmed = search.trim();
  const shouldFetch = enabled && trimmed.length >= 2;

  return useQuery({
    queryKey: ["court-lookup", trimmed, countryCode],
    queryFn: () =>
      apiGet<CourtLookupResponse>(
        `/api/v1/courts${buildQuery({
          search: trimmed,
          country_code: countryCode,
        })}`
      ),
    enabled: shouldFetch,
  });
}
