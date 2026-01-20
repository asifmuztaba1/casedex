"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/features/auth/use-auth";
import { useCourtLookup, type CourtLookup } from "@/features/courts/use-courts";
import { useLocale } from "@/components/locale-provider";
import { ChevronDown, X } from "lucide-react";

type CourtSelectProps = {
  value: string;
  onValueChange: (value: string) => void;
  onSelect: (court: CourtLookup | null) => void;
  selectedCourt?: CourtLookup | null;
  invalid?: boolean;
};

function formatCourtLabel(court: CourtLookup, locale: "en" | "bn") {
  return locale === "bn" ? court.name_bn : court.name;
}

function formatCourtMeta(court: CourtLookup, locale: "en" | "bn") {
  const district = court.district
    ? locale === "bn"
      ? court.district.name_bn
      : court.district.name
    : null;
  const division = court.division
    ? locale === "bn"
      ? court.division.name_bn
      : court.division.name
    : null;
  const type = court.court_type
    ? locale === "bn"
      ? court.court_type.name_bn
      : court.court_type.name
    : null;

  return [district, division, type].filter(Boolean).join(" · ");
}

export default function CourtSelect({
  value,
  onValueChange,
  onSelect,
  selectedCourt,
  invalid,
}: CourtSelectProps) {
  const { data: user } = useAuth();
  const { locale, t } = useLocale();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(value);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const countryCode = user?.country_code ?? undefined;

  const { data, isLoading } = useCourtLookup(search, countryCode, open);
  const courts = data?.data ?? [];

  useEffect(() => {
    setSearch(value);
  }, [value]);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (
        wrapperRef.current &&
        event.target instanceof Node &&
        !wrapperRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selectedLabel = useMemo(() => {
    if (selectedCourt) {
      return formatCourtLabel(selectedCourt, locale);
    }
    return "";
  }, [locale, selectedCourt]);

  return (
    <div className="relative" ref={wrapperRef}>
      <div className="flex items-center gap-2">
        <Input
          value={value}
          placeholder={t("courts.select_placeholder")}
          onChange={(event) => {
            const nextValue = event.target.value;
            setSearch(nextValue);
            onValueChange(nextValue);
            onSelect(null);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          aria-invalid={invalid}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={t("courts.open_list")}
          onClick={() => setOpen((prev) => !prev)}
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
        {selectedCourt && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={t("courts.clear_selection")}
            onClick={() => {
              onSelect(null);
              onValueChange("");
              setSearch("");
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {open && (
        <Card className="absolute z-20 mt-2 w-full border-slate-200 shadow-sm">
          <CardContent className="space-y-2 p-3">
            <Input
              value={search}
              placeholder={t("courts.search_placeholder")}
              onChange={(event) => {
                const nextValue = event.target.value;
                setSearch(nextValue);
                onValueChange(nextValue);
                onSelect(null);
              }}
            />
            {isLoading ? (
              <div className="py-4 text-sm text-slate-600">
                {t("courts.loading")}
              </div>
            ) : courts.length === 0 ? (
              <div className="py-4 text-sm text-slate-600">
                {t("courts.no_results")}
              </div>
            ) : (
              <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                {courts.map((court) => {
                  const label = formatCourtLabel(court, locale);
                  const meta = formatCourtMeta(court, locale);
                  const isSelected =
                    selectedCourt?.public_id === court.public_id ||
                    label === selectedLabel;
                  return (
                    <button
                      key={court.public_id}
                      type="button"
                      onClick={() => {
                        onSelect(court);
                        onValueChange(label);
                        setSearch(label);
                        setOpen(false);
                      }}
                      className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition ${
                        isSelected
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 bg-white text-slate-900 hover:bg-slate-50"
                      }`}
                    >
                      <div className="font-medium">{label}</div>
                      {meta && (
                        <div
                          className={`text-xs ${
                            isSelected ? "text-slate-100" : "text-slate-500"
                          }`}
                        >
                          {meta}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
