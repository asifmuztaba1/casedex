"use client";

import { useMemo, useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateCase } from "@/features/cases/use-cases";
import CourtSelect from "@/components/court-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLocale } from "@/components/locale-provider";
import TemplatePresetPicker from "@/components/template-preset-picker";
import type { CourtLookup } from "@/features/courts/use-courts";
import { useAuth, useUsers } from "@/features/auth/use-auth";
import {
  CASE_STORY_TEMPLATES,
  HEARING_AGENDA_TEMPLATES,
  PETITION_TEMPLATES,
} from "@/features/templates/legal-templates";
import { cn } from "@/lib/utils";

const REGISTRY_CASE_TYPES: Array<{ bn: string; en: string; slug: string }> = [
  { bn: "দেওয়ানী আপীল", en: "Civil Appeal", slug: "civil_appeal" },
  { bn: "ফৌজদারী আপীল", en: "Criminal Appeal", slug: "criminal_appeal" },
  { bn: "দেওয়ানী রিভিশন", en: "Civil Revision", slug: "civil_revision" },
  { bn: "ফৌজদারী রিভিশন", en: "Criminal Revision", slug: "criminal_revision" },
  { bn: "দেওয়ানী বিবিধ মামলা", en: "Civil Miscellaneous", slug: "civil_misc" },
  { bn: "ফৌজদারী বিবিধ মামলা", en: "Criminal Miscellaneous", slug: "criminal_misc" },
  { bn: "অর্পিত আপীল", en: "Entrusted Appeal", slug: "entrusted_appeal" },
  { bn: "পারিবারিক আপিল", en: "Family Appeal", slug: "family_appeal" },
  { bn: "পারিবারিক মামলা", en: "Family Case", slug: "family_case" },
  { bn: "মিস লুনাসি", en: "Lunacy Miscellaneous", slug: "misc_lunacy" },
  { bn: "মিস মামলা", en: "Miscellaneous Case", slug: "misc_case" },
  { bn: "ফৌজদারী মামলা", en: "Criminal Case", slug: "criminal_case" },
  { bn: "দেওয়ানী মামলা", en: "Civil Case", slug: "civil_case" },
  { bn: "রেন্ট মামলা", en: "Rent Case", slug: "rent_case" },
  { bn: "রেন্ট আপিল", en: "Rent Appeal", slug: "rent_appeal" },
  { bn: "মানিলোন মামলা", en: "Money Loan Case", slug: "money_loan_case" },
  { bn: "মানিলোন এ্যাপীল", en: "Money Loan Appeal", slug: "money_loan_appeal" },
  { bn: "অর্থ ঋণ মামলা", en: "Artha Rin (Money Loan) Case", slug: "money_loan_case_artharin" },
  { bn: "দায়রা মামলা", en: "Sessions Case", slug: "sessions_case" },
];

const participantSchema = z.object({
  user_public_id: z.string().min(2),
  role: z.enum(["lead_lawyer", "lawyer", "associate", "assistant", "viewer"]),
});

const partySchema = z.object({
  name: z.string().min(2),
  type: z.enum(["person", "organization"]),
  side: z.enum(["client", "opponent", "third_party"]),
  role: z.enum([
    "petitioner",
    "respondent",
    "appellant",
    "defendant",
    "claimant",
    "plaintiff",
    "applicant",
    "accused",
    "state",
    "other",
  ]),
  phone: z.string().optional(),
  email: z.union([z.literal(""), z.string().email()]).optional(),
  address: z.string().optional(),
  identity_number: z.string().optional(),
  notes: z.string().optional(),
});

type Side = "plaintiff" | "defendant";

export default function NewCasePage() {
  const router = useRouter();
  const createCase = useCreateCase();
  const { t, locale } = useLocale();
  const { data: user } = useAuth();
  const { data: usersData } = useUsers(Boolean(user?.tenant_id));
  const tenantUsers = usersData ?? [];

  const [step, setStep] = useState<1 | 2>(1);
  const [representSide, setRepresentSide] = useState<Side>("plaintiff");
  const [selectedCourt, setSelectedCourt] = useState<CourtLookup | null>(null);

  const caseSchema = useMemo(
    () =>
      z.object({
        // Step 1 — required
        plaintiff_name: z.string().min(2, t("common.required")),
        defendant_name: z.string().min(2, t("common.required")),
        opposite_lawyer_name: z.string().min(2, t("common.required")),
        court: z.string().min(2, t("common.required")),
        court_public_id: z.string().optional(),
        next_hearing_at: z.string().min(2, t("common.required")),

        // Step 2 — optional
        title: z.string().optional(),
        case_number: z.string().optional(),
        registry_case_type_bn: z.string().optional(),
        registry_case_serial: z
          .union([z.coerce.number().int().min(1), z.literal("")])
          .optional(),
        registry_case_year: z
          .union([z.coerce.number().int().min(1900).max(2100), z.literal("")])
          .optional(),
        story: z.string().optional(),
        petition_draft: z.string().optional(),
        client_phone: z.string().optional(),
        client_email: z.union([z.literal(""), z.string().email()]).optional(),
        client_address: z.string().optional(),
        parties: z.array(partySchema).optional(),
        participants: z.array(participantSchema).optional(),
        first_hearing_type: z.enum(["mention", "hearing", "trial", "order"]).optional(),
        first_hearing_agenda: z.string().optional(),
        first_hearing_location: z.string().optional(),
      }),
    [t]
  );

  type CaseFormValues = z.infer<typeof caseSchema>;

  const { register, handleSubmit, control, formState, setValue, trigger } =
    useForm<CaseFormValues>({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolver: zodResolver(caseSchema) as any,
      defaultValues: {
        parties: [],
        participants: [{ user_public_id: "", role: "lead_lawyer" }],
        first_hearing_type: "hearing",
      },
    });

  const courtValue = useWatch({ control, name: "court" }) ?? "";
  const storyValue = useWatch({ control, name: "story" }) ?? "";
  const petitionValue = useWatch({ control, name: "petition_draft" }) ?? "";
  const firstHearingAgendaValue =
    useWatch({ control, name: "first_hearing_agenda" }) ?? "";
  const selectedParticipants = useWatch({ control, name: "participants" }) ?? [];
  const [participantQuery, setParticipantQuery] = useState<Record<string, string>>(
    {}
  );

  const { fields, append, remove } = useFieldArray({
    control,
    name: "participants",
  });
  const {
    fields: partyFields,
    append: appendParty,
    remove: removeParty,
  } = useFieldArray({ control, name: "parties" });

  const mergeTemplateText = (current: string | undefined, template: string) => {
    const trimmedCurrent = current?.trim() ?? "";
    return trimmedCurrent ? `${trimmedCurrent}\n\n${template}` : template;
  };

  const buildPayload = (values: CaseFormValues) => {
    const isPlaintiff = representSide === "plaintiff";
    const clientName = isPlaintiff ? values.plaintiff_name : values.defendant_name;
    const opponentName = isPlaintiff ? values.defendant_name : values.plaintiff_name;
    const clientRole = isPlaintiff ? "petitioner" : "respondent";
    const opponentRole = isPlaintiff ? "respondent" : "petitioner";

    const userParties = (values.parties ?? []).map((p) =>
      p.email === "" ? { ...p, email: undefined } : p
    );

    return {
      title: values.title?.trim() || undefined,
      court: values.court,
      court_public_id: values.court_public_id || undefined,
      case_number: values.case_number || undefined,
      registry_case_type_bn: values.registry_case_type_bn || undefined,
      registry_case_serial:
        values.registry_case_serial === "" || values.registry_case_serial == null
          ? undefined
          : Number(values.registry_case_serial),
      registry_case_year:
        values.registry_case_year === "" || values.registry_case_year == null
          ? undefined
          : Number(values.registry_case_year),
      story: values.story?.trim() || undefined,
      petition_draft: values.petition_draft?.trim() || undefined,
      opposite_lawyer_name: values.opposite_lawyer_name,
      client: {
        name: clientName,
        phone: values.client_phone || undefined,
        email: values.client_email || undefined,
        address: values.client_address || undefined,
      },
      client_party_role: clientRole,
      client_party_type: "person" as const,
      parties: [
        {
          name: opponentName,
          type: "person" as const,
          side: "opponent" as const,
          role: opponentRole,
        },
        ...userParties,
      ],
      participants: values.participants?.filter(
        (p) => p.user_public_id && p.user_public_id.length > 0
      ),
      first_hearing: values.next_hearing_at
        ? {
            hearing_at: values.next_hearing_at,
            type: values.first_hearing_type ?? "hearing",
            agenda: values.first_hearing_agenda || undefined,
            location: values.first_hearing_location || undefined,
          }
        : undefined,
    };
  };

  const submit = (values: CaseFormValues) => {
    createCase.mutate(buildPayload(values), {
      onSuccess: (data) => router.push(`/cases/${data.public_id}`),
    });
  };

  const handleStep1Continue = async () => {
    const ok = await trigger([
      "plaintiff_name",
      "defendant_name",
      "opposite_lawyer_name",
      "court",
      "next_hearing_at",
    ]);
    if (ok) setStep(2);
  };

  const oppositeLawyerLabel =
    representSide === "plaintiff"
      ? t("cases.wizard.opposite_lawyer_for_defendant")
      : t("cases.wizard.opposite_lawyer_for_plaintiff");

  return (
    <section className="space-y-4 lg:space-y-6">
      <div
        className="sticky top-14 z-20 -mx-3 border-b border-[var(--border)] bg-[var(--paper)]/95 px-3 py-3 backdrop-blur md:-mx-6 md:px-6 lg:static lg:-mx-0 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-0"
      >
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--muted-soft)] lg:text-xs">
            {t("nav.new_case")}
          </p>
          <h1 className="text-xl font-semibold text-[var(--foreground)] lg:text-2xl">
            {step === 1 ? t("cases.wizard.step1_title") : t("cases.wizard.step2_title")}
          </h1>
          <p className="hidden text-sm text-[var(--muted)] lg:block">
            {step === 1 ? t("cases.wizard.step1_desc") : t("cases.wizard.step2_desc")}
          </p>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <div className="flex flex-1 items-center gap-1.5">
            <div
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                step >= 1 ? "bg-[var(--foreground)]" : "bg-[var(--border)]"
              )}
            />
            <div
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                step >= 2 ? "bg-[var(--foreground)]" : "bg-[var(--border)]"
              )}
            />
          </div>
          <span className="shrink-0 text-[11px] font-medium text-[var(--muted-soft)]">
            {t("cases.wizard.step_indicator")
              .replace("{current}", String(step))
              .replace("{total}", "2")}
          </span>
        </div>
      </div>

      <form
        className="space-y-4 pb-36 lg:space-y-6 lg:pb-0"
        onSubmit={handleSubmit(submit)}
      >
        <input type="hidden" {...register("court_public_id")} />

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>{t("cases.wizard.step1_title")}</CardTitle>
              <CardDescription>{t("cases.wizard.step1_desc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--muted)]">
                    {t("cases.wizard.plaintiff")}
                  </label>
                  <Input
                    placeholder={t("cases.wizard.plaintiff_placeholder")}
                    {...register("plaintiff_name")}
                    aria-invalid={Boolean(formState.errors.plaintiff_name)}
                  />
                  {formState.errors.plaintiff_name && (
                    <p className="text-xs text-rose-600">
                      {formState.errors.plaintiff_name.message as string}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--muted)]">
                    {t("cases.wizard.defendant")}
                  </label>
                  <Input
                    placeholder={t("cases.wizard.defendant_placeholder")}
                    {...register("defendant_name")}
                    aria-invalid={Boolean(formState.errors.defendant_name)}
                  />
                  {formState.errors.defendant_name && (
                    <p className="text-xs text-rose-600">
                      {formState.errors.defendant_name.message as string}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--muted)]">
                  {t("cases.wizard.represent_label")}
                </label>
                <div className="inline-flex rounded-lg border border-[var(--border)] p-1">
                  {(["plaintiff", "defendant"] as const).map((side) => (
                    <button
                      key={side}
                      type="button"
                      onClick={() => setRepresentSide(side)}
                      className={cn(
                        "rounded-md px-3 py-1.5 text-sm transition-colors",
                        representSide === side
                          ? "bg-[var(--foreground)] text-[var(--paper)]"
                          : "text-[var(--muted)] hover:text-[var(--foreground)]"
                      )}
                    >
                      {t(
                        side === "plaintiff"
                          ? "cases.wizard.plaintiff"
                          : "cases.wizard.defendant"
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--muted)]">
                  {oppositeLawyerLabel}
                </label>
                <Input
                  placeholder={oppositeLawyerLabel}
                  {...register("opposite_lawyer_name")}
                  aria-invalid={Boolean(formState.errors.opposite_lawyer_name)}
                />
                {formState.errors.opposite_lawyer_name && (
                  <p className="text-xs text-rose-600">
                    {formState.errors.opposite_lawyer_name.message as string}
                  </p>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--muted)]">
                    {t("cases.case.court")}
                  </label>
                  <CourtSelect
                    value={courtValue}
                    selectedCourt={selectedCourt}
                    invalid={Boolean(formState.errors.court)}
                    onValueChange={(value) => {
                      setSelectedCourt(null);
                      setValue("court", value, { shouldValidate: true });
                      setValue("court_public_id", undefined);
                    }}
                    onSelect={(court) => {
                      setSelectedCourt(court);
                      setValue(
                        "court",
                        court ? (locale === "bn" ? court.name_bn : court.name) : "",
                        { shouldValidate: true }
                      );
                      setValue("court_public_id", court?.public_id);
                    }}
                  />
                  {formState.errors.court && (
                    <p className="text-xs text-rose-600">
                      {formState.errors.court.message as string}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--muted)]">
                    {t("cases.wizard.next_date")}
                  </label>
                  <Input
                    type="datetime-local"
                    {...register("next_hearing_at")}
                    aria-invalid={Boolean(formState.errors.next_hearing_at)}
                  />
                  {formState.errors.next_hearing_at && (
                    <p className="text-xs text-rose-600">
                      {formState.errors.next_hearing_at.message as string}
                    </p>
                  )}
                </div>
              </div>

              <div className="hidden flex-wrap items-center gap-3 pt-2 lg:flex">
                <Button
                  type="submit"
                  variant="outline"
                  disabled={createCase.isPending}
                >
                  {createCase.isPending
                    ? t("cases.actions.saving")
                    : t("cases.actions.create")}
                </Button>
                <Button type="button" onClick={handleStep1Continue}>
                  {t("cases.wizard.continue")}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>{t("cases.sections.basics")}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <Input placeholder={t("cases.case.title")} {...register("title")} />
                <Input
                  placeholder={t("cases.case.number")}
                  {...register("case_number")}
                />
                <Input
                  placeholder={t("cases.client.phone")}
                  {...register("client_phone")}
                />
                <Input
                  placeholder={t("cases.client.email_optional")}
                  {...register("client_email")}
                />
                <Input
                  placeholder={t("cases.client.address")}
                  {...register("client_address")}
                  className="md:col-span-2"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("cases.sections.registry")}</CardTitle>
                <CardDescription>{t("cases.registry.desc")}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                <select
                  className="h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--paper)] px-3 text-base md:h-10 md:text-sm"
                  {...register("registry_case_type_bn")}
                  defaultValue=""
                >
                  <option value="">{t("cases.registry.type_placeholder")}</option>
                  {REGISTRY_CASE_TYPES.map((type) => (
                    <option key={type.slug} value={type.bn}>
                      {locale === "bn" ? type.bn : `${type.en} (${type.bn})`}
                    </option>
                  ))}
                </select>
                <Input
                  type="number"
                  min={1}
                  placeholder={t("cases.registry.serial_placeholder")}
                  {...register("registry_case_serial")}
                />
                <Input
                  type="number"
                  min={1900}
                  max={2100}
                  placeholder={t("cases.registry.year_placeholder")}
                  {...register("registry_case_year")}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("cases.sections.story")}</CardTitle>
                <CardDescription>{t("cases.story.placeholder")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <TemplatePresetPicker
                  title={t("templates.story.title")}
                  description={t("templates.story.desc")}
                  locale={locale}
                  templates={CASE_STORY_TEMPLATES}
                  onSelect={(template) =>
                    setValue("story", mergeTemplateText(storyValue, template), {
                      shouldDirty: true,
                    })
                  }
                />
                <textarea
                  className="h-32 w-full rounded-lg border border-[var(--border)] bg-[var(--paper)] px-3 py-2 text-base md:text-sm"
                  placeholder={t("cases.story.placeholder")}
                  {...register("story")}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("cases.sections.petition")}</CardTitle>
                <CardDescription>{t("cases.petition.placeholder")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <TemplatePresetPicker
                  title={t("templates.petition.title")}
                  description={t("templates.petition.desc")}
                  locale={locale}
                  templates={PETITION_TEMPLATES}
                  onSelect={(template) =>
                    setValue(
                      "petition_draft",
                      mergeTemplateText(petitionValue, template),
                      { shouldDirty: true }
                    )
                  }
                />
                <textarea
                  className="h-32 w-full rounded-lg border border-[var(--border)] bg-[var(--paper)] px-3 py-2 text-base md:text-sm"
                  placeholder={t("cases.petition.placeholder")}
                  {...register("petition_draft")}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("cases.sections.parties")}</CardTitle>
                <CardDescription>{t("case.detail.parties")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {partyFields.length === 0 && (
                  <p className="text-sm text-[var(--muted)]">
                    {t("cases.parties.empty")}
                  </p>
                )}
                {partyFields.map((field, index) => (
                  <div
                    key={field.id}
                    className="grid gap-3 rounded-2xl border border-[var(--border)] p-4"
                  >
                    <div className="grid gap-3 md:grid-cols-2">
                      <Input
                        placeholder={t("cases.parties.name")}
                        {...register(`parties.${index}.name`)}
                      />
                      <select
                        className="h-11 rounded-lg border border-[var(--border)] bg-[var(--paper)] px-3 text-base md:h-10 md:text-sm"
                        {...register(`parties.${index}.type`)}
                      >
                        <option value="person">{t("party.type.person")}</option>
                        <option value="organization">
                          {t("party.type.organization")}
                        </option>
                      </select>
                      <select
                        className="h-11 rounded-lg border border-[var(--border)] bg-[var(--paper)] px-3 text-base md:h-10 md:text-sm"
                        {...register(`parties.${index}.side`)}
                      >
                        <option value="opponent">{t("party.side.opponent")}</option>
                        <option value="third_party">
                          {t("party.side.third_party")}
                        </option>
                        <option value="client">{t("party.side.client")}</option>
                      </select>
                      <select
                        className="h-11 rounded-lg border border-[var(--border)] bg-[var(--paper)] px-3 text-base md:h-10 md:text-sm"
                        {...register(`parties.${index}.role`)}
                      >
                        <option value="petitioner">{t("party.role.petitioner")}</option>
                        <option value="respondent">{t("party.role.respondent")}</option>
                        <option value="appellant">{t("party.role.appellant")}</option>
                        <option value="defendant">{t("party.role.defendant")}</option>
                        <option value="claimant">{t("party.role.claimant")}</option>
                        <option value="plaintiff">{t("party.role.plaintiff")}</option>
                        <option value="applicant">{t("party.role.applicant")}</option>
                        <option value="accused">{t("party.role.accused")}</option>
                        <option value="state">{t("party.role.state")}</option>
                        <option value="other">{t("party.role.other")}</option>
                      </select>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <Input
                        placeholder={t("cases.parties.phone")}
                        {...register(`parties.${index}.phone`)}
                      />
                      <Input
                        placeholder={t("cases.parties.email")}
                        {...register(`parties.${index}.email`)}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => removeParty(index)}
                    >
                      {t("cases.parties.remove")}
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    appendParty({
                      name: "",
                      type: "person",
                      side: "third_party",
                      role: "other",
                      phone: "",
                      email: "",
                      address: "",
                      identity_number: "",
                      notes: "",
                    })
                  }
                >
                  {t("cases.parties.add")}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("cases.sections.team")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="grid gap-3 md:grid-cols-[2fr_1fr_auto]"
                  >
                    <input
                      type="hidden"
                      {...register(`participants.${index}.user_public_id`)}
                    />
                    <div className="relative">
                      <Input
                        placeholder={t("cases.team.user_public_id")}
                        value={participantQuery[field.id] ?? ""}
                        onChange={(event) => {
                          const value = event.target.value;
                          setParticipantQuery((prev) => ({
                            ...prev,
                            [field.id]: value,
                          }));
                          setValue(`participants.${index}.user_public_id`, "");
                        }}
                      />
                      {Boolean(participantQuery[field.id]) && (
                        <div className="absolute z-10 mt-2 max-h-64 w-full overflow-auto rounded-lg border border-[var(--border)] bg-[var(--paper)] shadow-sm">
                          {tenantUsers
                            .filter((member) => {
                              const query =
                                participantQuery[field.id]?.trim().toLowerCase() ??
                                "";
                              if (!query) return false;
                              const name = member.name?.toLowerCase() ?? "";
                              const email = member.email?.toLowerCase() ?? "";
                              const matches =
                                name.includes(query) || email.includes(query);
                              const selectedIds = new Set(
                                selectedParticipants
                                  .map((p) => p?.user_public_id)
                                  .filter(Boolean)
                              );
                              const currentId =
                                selectedParticipants[index]?.user_public_id ?? "";
                              if (member.public_id === currentId) return matches;
                              return matches && !selectedIds.has(member.public_id);
                            })
                            .map((member) => (
                              <button
                                key={member.public_id}
                                type="button"
                                className="flex w-full flex-col px-3 py-2 text-left text-sm hover:bg-[var(--paper-hover)]"
                                onClick={() => {
                                  setValue(
                                    `participants.${index}.user_public_id`,
                                    member.public_id
                                  );
                                  setParticipantQuery((prev) => ({
                                    ...prev,
                                    [field.id]: member.email
                                      ? `${member.name} (${member.email})`
                                      : member.name,
                                  }));
                                }}
                              >
                                <span className="text-[var(--foreground)]">
                                  {member.name}
                                </span>
                                {member.email && (
                                  <span className="text-xs text-[var(--muted-soft)]">
                                    {member.email}
                                  </span>
                                )}
                              </button>
                            ))}
                        </div>
                      )}
                    </div>
                    <select
                      className="h-11 rounded-lg border border-[var(--border)] bg-[var(--paper)] px-3 text-base md:h-10 md:text-sm"
                      {...register(`participants.${index}.role`)}
                    >
                      <option value="lead_lawyer">{t("roles.lead_lawyer")}</option>
                      <option value="lawyer">{t("roles.lawyer")}</option>
                      <option value="associate">{t("roles.associate")}</option>
                      <option value="assistant">{t("roles.assistant")}</option>
                      <option value="viewer">{t("roles.viewer")}</option>
                    </select>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => remove(index)}
                    >
                      {t("cases.team.remove")}
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    append({ user_public_id: "", role: "associate" })
                  }
                >
                  {t("cases.team.add")}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("cases.sections.hearing")}</CardTitle>
                <CardDescription>{t("cases.hearing.agenda")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <TemplatePresetPicker
                  title={t("templates.hearing.title")}
                  description={t("templates.hearing.desc")}
                  locale={locale}
                  templates={HEARING_AGENDA_TEMPLATES}
                  onSelect={(template) =>
                    setValue(
                      "first_hearing_agenda",
                      mergeTemplateText(firstHearingAgendaValue, template),
                      { shouldDirty: true }
                    )
                  }
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <select
                    className="h-11 rounded-lg border border-[var(--border)] bg-[var(--paper)] px-3 text-base md:h-10 md:text-sm"
                    {...register("first_hearing_type")}
                  >
                    <option value="mention">{t("hearing.type.mention")}</option>
                    <option value="hearing">{t("hearing.type.hearing")}</option>
                    <option value="trial">{t("hearing.type.trial")}</option>
                    <option value="order">{t("hearing.type.order")}</option>
                  </select>
                  <Input
                    placeholder={t("cases.hearing.location")}
                    {...register("first_hearing_location")}
                  />
                  <Input
                    placeholder={t("cases.hearing.agenda")}
                    {...register("first_hearing_agenda")}
                    className="md:col-span-2"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="hidden flex-wrap items-center gap-3 lg:flex">
              <Button type="button" variant="outline" onClick={() => setStep(1)}>
                ← {t("cases.wizard.go_back")}
              </Button>
              <Button type="submit" disabled={createCase.isPending}>
                {createCase.isPending
                  ? t("cases.actions.saving")
                  : t("cases.wizard.save_finish")}
              </Button>
              {Object.keys(formState.errors).length > 0 && (
                <Badge variant="subtle">
                  {t("cases.actions.review_required")}
                </Badge>
              )}
            </div>
          </>
        )}

        {/* Mobile sticky bottom action bar — sits above the workspace tab bar */}
        <div
          className="fixed inset-x-0 z-20 border-t border-[var(--border)] bg-[var(--paper)]/95 px-3 py-3 backdrop-blur lg:hidden print:hidden"
          style={{ bottom: "calc(4rem + env(safe-area-inset-bottom))" }}
        >
          {step === 1 ? (
            <div className="flex items-center gap-2">
              <Button
                type="submit"
                variant="outline"
                size="lg"
                disabled={createCase.isPending}
                className="flex-1"
              >
                {createCase.isPending
                  ? t("cases.actions.saving")
                  : t("cases.actions.create")}
              </Button>
              <Button
                type="button"
                size="lg"
                onClick={handleStep1Continue}
                className="flex-1"
              >
                {t("cases.wizard.continue")}
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => setStep(1)}
                className="shrink-0"
              >
                ←
              </Button>
              <Button
                type="submit"
                size="lg"
                disabled={createCase.isPending}
                className="flex-1"
              >
                {createCase.isPending
                  ? t("cases.actions.saving")
                  : t("cases.wizard.save_finish")}
              </Button>
            </div>
          )}
          {Object.keys(formState.errors).length > 0 && (
            <p className="mt-2 text-center text-xs text-rose-600">
              {t("cases.actions.review_required")}
            </p>
          )}
        </div>
      </form>
    </section>
  );
}
