import type { CountryOption } from "@/features/countries/use-countries";

type Translator = (key: string) => string;

export function formatCountryLabel(country: CountryOption, t: Translator) {
  const suffixKey = country.active
    ? "countries.active_label"
    : "countries.inactive_label";

  return `${country.name} (${t(suffixKey)})`;
}
