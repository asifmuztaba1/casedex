"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  type AuthUser,
  useAuth,
  useCreateUser,
  useUpdateUser,
  useUsers,
} from "@/features/auth/use-auth";
import { type CountryOption, useCountries } from "@/features/countries/use-countries";
import { useLocale } from "@/components/locale-provider";
import { formatCountryLabel } from "@/features/countries/country-label";

const roleOptions = ["admin", "lawyer", "associate", "assistant", "viewer"] as const;

export default function TeamSettingsPage() {
  const { data: user } = useAuth();
  const isAdmin = user?.role === "admin";
  const { data: users, isLoading } = useUsers(Boolean(isAdmin));
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const { data: countriesData } = useCountries();
  const countries = useMemo(() => countriesData?.data ?? [], [countriesData]);
  const { t } = useLocale();

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("settings.team.no_admin_title")}</CardTitle>
          <CardDescription>
            {t("settings.team.no_admin_desc")}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <TeamSettingsContent
      key={user.public_id}
      user={user}
      users={users}
      isLoading={isLoading}
      createUser={createUser}
      updateUser={updateUser}
      countries={countries}
    />
  );
}

function TeamSettingsContent({
  user,
  users,
  isLoading,
  createUser,
  updateUser,
  countries,
}: {
  user: AuthUser;
  users: ReturnType<typeof useUsers>["data"];
  isLoading: boolean;
  createUser: ReturnType<typeof useCreateUser>;
  updateUser: ReturnType<typeof useUpdateUser>;
  countries: CountryOption[];
}) {
  const { t, locale } = useLocale();
  const defaultCountryId = user.country_id ? String(user.country_id) : "";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<(typeof roleOptions)[number]>("lawyer");
  const [countryId, setCountryId] = useState(defaultCountryId);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const nameError = submitted && !name.trim();
  const emailError = submitted && !email.trim();
  const emailInvalid =
    submitted && email.trim().length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const countryError = submitted && !countryId;
  const passwordRequired = !editingUserId;
  const passwordError = submitted && passwordRequired && !password.trim();

  const resetForm = () => {
    setEditingUserId(null);
    setName("");
    setEmail("");
    setPassword("");
    setRole("lawyer");
    setCountryId(defaultCountryId);
    setSubmitted(false);
  };

  return (
    <section className="space-y-6">
      <Card>
        <CardHeader className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
            {t("settings.team.kicker")}
          </p>
          <CardTitle className="text-2xl font-semibold">
            {t("settings.team.header")}
          </CardTitle>
          <CardDescription>
            {t("settings.team.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_140px_140px_auto]">
            <div className="space-y-1">
              <Input
                placeholder={t("settings.team.name")}
                value={name}
                onChange={(event) => setName(event.target.value)}
                aria-invalid={!!nameError}
              />
              {nameError && (
                <p className="text-xs text-rose-600">{t("common.required")}</p>
              )}
            </div>
            <div className="space-y-1">
              <Input
                placeholder={t("settings.team.email")}
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                aria-invalid={!!(emailError || emailInvalid)}
              />
              {emailError && (
                <p className="text-xs text-rose-600">{t("common.required")}</p>
              )}
              {emailInvalid && (
                <p className="text-xs text-rose-600">{t("common.invalid_email")}</p>
              )}
            </div>
            <div className="space-y-1">
              <Input
                placeholder={t("settings.team.temp_password")}
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                aria-invalid={!!passwordError}
              />
              {passwordError && (
                <p className="text-xs text-rose-600">{t("common.required")}</p>
              )}
            </div>
            <div>
              <select
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900"
                value={role}
                onChange={(event) =>
                  setRole(event.target.value as typeof role)
                }
              >
                {roleOptions.map((option) => (
                  <option key={option} value={option}>
                    {t(`roles.${option}`)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <select
                className={`h-10 rounded-lg border bg-white px-3 text-sm text-slate-900 ${
                  countryError
                    ? "border-rose-500 focus-visible:ring-rose-500"
                    : "border-slate-200"
                }`}
                value={countryId}
                onChange={(event) => setCountryId(event.target.value)}
                aria-invalid={!!countryError}
              >
                <option value="">{t("settings.team.country")}</option>
                {countries.map((country) => (
                  <option key={country.id} value={country.id} disabled={!country.active}>
                    {formatCountryLabel(country, t)}
                  </option>
                ))}
              </select>
              {countryError && (
                <p className="text-xs text-rose-600">{t("common.required")}</p>
              )}
            </div>
            <Button
              onClick={() => {
                setSubmitted(true);
                if (
                  !name.trim() ||
                  !email.trim() ||
                  !countryId ||
                  (passwordRequired && !password.trim())
                ) {
                  return;
                }
                if (editingUserId) {
                  updateUser.mutate(
                    {
                      public_id: editingUserId,
                      name,
                      email,
                      role,
                      country_id: Number(countryId),
                      password: password || undefined,
                      locale,
                    },
                    {
                      onSuccess: resetForm,
                    }
                  );
                  return;
                }

                createUser.mutate(
                  {
                    name,
                    email,
                    password,
                    role,
                    country_id: Number(countryId),
                    locale,
                  },
                  {
                    onSuccess: resetForm,
                  }
                );
              }}
              disabled={createUser.isPending || updateUser.isPending || !countryId}
            >
              {editingUserId
                ? updateUser.isPending
                  ? t("settings.team.update_pending")
                  : t("settings.team.update_user")
                : createUser.isPending
                  ? t("settings.team.add_pending")
                  : t("settings.team.add_user")}
            </Button>
            {editingUserId && (
              <Button
                variant="outline"
                onClick={resetForm}
              >
                {t("common.cancel")}
              </Button>
            )}
          </div>
          {(createUser.isError || updateUser.isError) && (
            <div className="text-sm text-rose-600">
              {editingUserId
                ? t("settings.team.update_error")
                : t("settings.team.add_error")}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("settings.team.directory")}</CardTitle>
          <CardDescription>{t("settings.team.directory_desc")}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-sm text-slate-600">
              {t("settings.team.loading")}
            </div>
          ) : users && users.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("settings.team.name_label")}</TableHead>
                  <TableHead>{t("settings.team.email")}</TableHead>
                  <TableHead>{t("settings.team.role")}</TableHead>
                  <TableHead>{t("settings.team.country")}</TableHead>
                  <TableHead>{t("table.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((member) => (
                  <TableRow key={member.public_id}>
                    <TableCell>{member.name}</TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell className="capitalize">
                      {member.role ? t(`roles.${member.role}`) : t("roles.viewer")}
                    </TableCell>
                    <TableCell>{member.country ?? "-"}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingUserId(member.public_id);
                          setName(member.name ?? "");
                          setEmail(member.email ?? "");
                          setPassword("");
                          setRole(member.role as (typeof roleOptions)[number]);
                          setCountryId(member.country_id ? String(member.country_id) : defaultCountryId);
                          setSubmitted(false);
                        }}
                      >
                        {t("common.edit")}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-sm text-slate-600">{t("settings.team.empty")}</div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
