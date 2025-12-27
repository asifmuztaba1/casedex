import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";

export type CountryOption = {
  id: number;
  name: string;
  code: string;
};

type CountryListResponse = {
  data: CountryOption[];
};

export function useCountries() {
  return useQuery({
    queryKey: ["countries"],
    queryFn: () => apiGet<CountryListResponse>("/api/v1/countries"),
  });
}
