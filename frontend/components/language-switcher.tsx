"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocale } from "@/components/locale-provider";
import { useAuth, useUpdateProfile } from "@/features/auth/use-auth";
import type { Locale } from "@/lib/locale";

const options: Array<{ label: string; flag: string; value: Locale }> = [
  { label: "বাংলা", flag: "\u{1F1E7}\u{1F1E9}", value: "bn" },
  { label: "English", flag: "\u{1F1EC}\u{1F1E7}", value: "en" },
];

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();
  const { data: user } = useAuth();
  const updateProfile = useUpdateProfile();

  const active = options.find((option) => option.value === locale) ?? options[1];

  const handleChange = (next: Locale) => {
    setLocale(next);

    if (user) {
      updateProfile.mutate({
        name: user.name,
        email: user.email,
        country_id: user.country_id ?? 1,
        locale: next,
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Language">
          <span className="text-lg leading-none">{active.flag}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => handleChange(option.value)}
            className={locale === option.value ? "font-semibold" : ""}
          >
            <span className="mr-2 text-base leading-none">{option.flag}</span>
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
