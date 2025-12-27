"use client";

import { Globe } from "lucide-react";
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

const options: Array<{ label: string; value: Locale }> = [
  { label: "বাংলা", value: "bn" },
  { label: "English", value: "en" },
];

export default function LanguageSwitcher() {
  const { locale, setLocale, t } = useLocale();
  const { data: user } = useAuth();
  const updateProfile = useUpdateProfile();

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
        <Button variant="outline" size="sm" className="gap-2">
          <Globe className="h-4 w-4" />
          {t("nav.language")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => handleChange(option.value)}
            className={locale === option.value ? "font-semibold" : ""}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
