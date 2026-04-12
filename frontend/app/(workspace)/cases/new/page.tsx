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
  email: z.string().email().optional(),
  address: z.string().optional(),
  identity_number: z.string().optional(),
  notes: z.string().optional(),
});

export default function NewCasePage() {
  const router = useRouter();
  const createCase = useCreateCase();
  const { t, locale } = useLocale();
  const { data: user } = useAuth();
  const { data: usersData } = useUsers(Boolean(user?.tenant_id));
  const tenantUsers = usersData ?? [];
  const [useExistingClient, setUseExistingClient] = useState(false);
  const [includeFirstHearing, setIncludeFirstHearing] = useState(false);
  const [selectedCourt, setSelectedCourt] = useState<CourtLookup | null>(null);

  const caseSchema = useMemo(
    () =>
      z
        .object({
          title: z.string().min(2),
          court: z.string().min(2),
          court_public_id: z.string().optional(),
          case_number: z.string().optional(),
          registry_case_type_bn: z.string().optional(),
          registry_case_serial: z.coerce.number().int().min(1).optional(),
          registry_case_year: z.coerce.number().int().min(1900).max(2100).optional(),
          story: z.string().min(2),
          petition_draft: z.string().min(2),
          client_id: z.coerce.number().int().optional(),
          client: z
            .object({
              name: z.string().min(2),
              phone: z.string().optional(),
              email: z.string().email().optional(),
              address: z.string().optional(),
              identity_number: z.string().optional(),
              notes: z.string().optional(),
            })
            .optional(),
          client_party_role: z
            .enum([
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
            ])
            .optional(),
          client_party_type: z.enum(["person", "organization"]).optional(),
          parties: z.array(partySchema).optional(),
          participants: z.array(participantSchema).optional(),
          first_hearing: z
            .object({
              hearing_at: z.string().min(2),
              type: z.enum(["mention", "hearing", "trial", "order"]),
              agenda: z.string().optional(),
              location: z.string().optional(),
            })
            .optional(),
        })
        .superRefine((values, ctx) => {
          if (!values.client_id && !values.client?.name) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: t("cases.validation.client_required"),
              path: ["client", "name"],
            });
          }

          const hasType = Boolean(values.registry_case_type_bn);
          const hasSerial = values.registry_case_serial !== undefined && values.registry_case_serial !== null;
          const hasYear = values.registry_case_year !== undefined && values.registry_case_year !== null;
          const registryCount = [hasType, hasSerial, hasYear].filter(Boolean).length;

          if (registryCount > 0 && registryCount < 3) {
            const message = t("cases.validation.registry_required");
            if (!hasType) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message,
                path: ["registry_case_type_bn"],
              });
            }
            if (!hasSerial) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message,
                path: ["registry_case_serial"],
              });
            }
            if (!hasYear) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message,
                path: ["registry_case_year"],
              });
            }
          }
        }),
    [t]
  );

  type CaseFormValues = z.infer<typeof caseSchema>;

  const { register, handleSubmit, control, formState, setValue } =
    useForm<CaseFormValues>({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolver: zodResolver(caseSchema) as any,
      defaultValues: {
        client_party_role: "petitioner",
        client_party_type: "person",
        parties: [],
        participants: [
          {
            user_public_id: "",
            role: "lead_lawyer",
          },
        ],
      },
    });

  const courtValue = useWatch({ control, name: "court" }) ?? "";
  const storyValue = useWatch({ control, name: "story" }) ?? "";
  const petitionValue = useWatch({ control, name: "petition_draft" }) ?? "";
  const firstHearingAgendaValue =
    useWatch({ control, name: "first_hearing.agenda" }) ?? "";
  const selectedParticipants = useWatch({ control, name: "participants" }) ?? [];
  const [participantQuery, setParticipantQuery] = useState<Record<string, string>>(
    {}
  );
  const showErrors = formState.submitCount > 0;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "participants",
  });

  const {
    fields: partyFields,
    append: appendParty,
    remove: removeParty,
  } = useFieldArray({
    control,
    name: "parties",
  });

  const clientError = Boolean(formState.errors.client?.name);
  const titleError = Boolean(formState.errors.title);
  const courtError = Boolean(formState.errors.court);
  const storyError = Boolean(formState.errors.story);
  const petitionError = Boolean(formState.errors.petition_draft);

  const mergeTemplateText = (current: string | undefined, template: string) => {
    const trimmedCurrent = current?.trim() ?? "";
    if (!trimmedCurrent) {
      return template;
    }
    return `${trimmedCurrent}\n\n${template}`;
  };

  const onSubmit = (values: CaseFormValues) => {
    const payload: CaseFormValues = {
      ...values,
    };

    if (!includeFirstHearing) {
      delete payload.first_hearing;
    }

    if (useExistingClient) {
      delete payload.client;
    } else {
      delete payload.client_id;
    }

    createCase.mutate(payload, {
      onSuccess: (data) => {
        router.push(`/cases/${data.public_id}`);
      },
    });
  };

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted-soft)]">
          {t("nav.new_case")}
        </p>
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">
          {t("cases.new.title")}
        </h1>
        <p className="text-sm text-[var(--muted)]">
          {t("cases.new.subtitle")}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <Card className="h-fit">
          <CardHeader className="space-y-2">
            <CardTitle className="text-base">{t("cases.sections.title")}</CardTitle>
            <CardDescription>{t("cases.sections.desc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-[var(--muted)]">
            <div>1. {t("cases.sections.client")}</div>
            <div>2. {t("cases.sections.basics")}</div>
            <div>3. {t("cases.sections.registry")}</div>
            <div>4. {t("cases.sections.story")}</div>
            <div>5. {t("cases.sections.petition")}</div>
            <div>6. {t("cases.sections.parties")}</div>
            <div>7. {t("cases.sections.team")}</div>
            <div>8. {t("cases.sections.hearing")}</div>
          </CardContent>
        </Card>

        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <input type="hidden" {...register("court_public_id")} />
          <Card>
            <CardHeader className="space-y-2">
              <CardTitle>{t("cases.sections.client")}</CardTitle>
              <CardDescription>
                {t("cases.new.subtitle")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="flex items-center gap-2 text-sm text-[var(--muted)]">
                <input
                  type="checkbox"
                  checked={useExistingClient}
                  onChange={(event) =>
                    setUseExistingClient(event.target.checked)
                  }
                />
                {t("cases.client.use_existing")}
              </label>

              {useExistingClient ? (
                <Input
                  placeholder={t("cases.client.id")}
                  {...register("client_id")}
                  aria-invalid={!!(showErrors && clientError)}
                />
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    placeholder={t("cases.client.name")}
                    {...register("client.name")}
                    aria-invalid={!!(showErrors && clientError)}
                  />
                  <Input
                    placeholder={t("cases.client.phone")}
                    {...register("client.phone")}
                  />
                  <Input
                    placeholder={t("cases.client.email")}
                    {...register("client.email")}
                  />
                  <Input
                    placeholder={t("cases.client.address")}
                    {...register("client.address")}
                  />
                  <Input
                    placeholder={t("cases.client.identity")}
                    {...register("client.identity_number")}
                  />
                  <Input
                    placeholder={t("cases.client.notes")}
                    {...register("client.notes")}
                  />
                </div>
              )}
              {showErrors && clientError && (
                <p className="text-xs text-rose-600">{t("common.required")}</p>
              )}
              <div className="grid gap-3 md:grid-cols-2">
                <select
                  className="h-10 rounded-lg border border-[var(--border)] bg-[var(--paper)] px-3 text-sm text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--foreground)] focus-visible:ring-offset-2"
                  {...register("client_party_type")}
                >
                  <option value="person">{t("party.type.person")}</option>
                  <option value="organization">{t("party.type.organization")}</option>
                </select>
                <select
                  className="h-10 rounded-lg border border-[var(--border)] bg-[var(--paper)] px-3 text-sm text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--foreground)] focus-visible:ring-offset-2"
                  {...register("client_party_role")}
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="space-y-2">
              <CardTitle>{t("cases.sections.basics")}</CardTitle>
              <CardDescription>
                {t("cases.new.subtitle")}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <Input
                  placeholder={t("cases.case.title")}
                  {...register("title")}
                  aria-invalid={!!(showErrors && titleError)}
                />
                {showErrors && titleError && (
                  <p className="text-xs text-rose-600">{t("common.required")}</p>
                )}
              </div>
              <div className="space-y-1">
                <CourtSelect
                  value={courtValue}
                  selectedCourt={selectedCourt}
                  invalid={showErrors && courtError}
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
                {showErrors && courtError && (
                  <p className="text-xs text-rose-600">{t("common.required")}</p>
                )}
              </div>
              <Input
                placeholder={t("cases.case.number")}
                {...register("case_number")}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="space-y-2">
              <CardTitle>{t("cases.sections.registry")}</CardTitle>
              <CardDescription>{t("cases.registry.desc")}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1">
                <select
                  className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--paper)] px-3 text-sm text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--foreground)] focus-visible:ring-offset-2"
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
                {showErrors && formState.errors.registry_case_type_bn && (
                  <p className="text-xs text-rose-600">
                    {t("cases.validation.registry_required")}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <Input
                  type="number"
                  min={1}
                  placeholder={t("cases.registry.serial_placeholder")}
                  {...register("registry_case_serial")}
                />
                {showErrors && formState.errors.registry_case_serial && (
                  <p className="text-xs text-rose-600">
                    {t("cases.validation.registry_required")}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <Input
                  type="number"
                  min={1900}
                  max={2100}
                  placeholder={t("cases.registry.year_placeholder")}
                  {...register("registry_case_year")}
                />
                {showErrors && formState.errors.registry_case_year && (
                  <p className="text-xs text-rose-600">
                    {t("cases.validation.registry_required")}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="space-y-2">
              <CardTitle>{t("cases.sections.story")}</CardTitle>
              <CardDescription>
                {t("cases.story.placeholder")}
              </CardDescription>
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
                    shouldValidate: true,
                  })
                }
              />
              <textarea
                className={`h-32 w-full rounded-lg border bg-[var(--paper)] px-3 py-2 text-sm text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 ${
                  showErrors && storyError
                    ? "border-rose-500 focus-visible:ring-rose-500"
                    : "border-[var(--border)] focus-visible:ring-[var(--foreground)]"
                }`}
                placeholder={t("cases.story.placeholder")}
                {...register("story")}
              />
              {showErrors && storyError && (
                <p className="mt-2 text-xs text-rose-600">{t("common.required")}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="space-y-2">
              <CardTitle>{t("cases.sections.petition")}</CardTitle>
              <CardDescription>
                {t("cases.petition.placeholder")}
              </CardDescription>
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
                    {
                      shouldDirty: true,
                      shouldValidate: true,
                    }
                  )
                }
              />
              <textarea
                className={`h-32 w-full rounded-lg border bg-[var(--paper)] px-3 py-2 text-sm text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 ${
                  showErrors && petitionError
                    ? "border-rose-500 focus-visible:ring-rose-500"
                    : "border-[var(--border)] focus-visible:ring-[var(--foreground)]"
                }`}
                placeholder={t("cases.petition.placeholder")}
                {...register("petition_draft")}
              />
              {showErrors && petitionError && (
                <p className="mt-2 text-xs text-rose-600">{t("common.required")}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="space-y-2">
              <CardTitle>{t("cases.sections.parties")}</CardTitle>
              <CardDescription>
                {t("case.detail.parties")}
              </CardDescription>
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
                    <div className="space-y-1">
                      <Input
                        placeholder={t("cases.parties.name")}
                        {...register(`parties.${index}.name`)}
                        aria-invalid={
                          showErrors &&
                          Boolean(formState.errors.parties?.[index]?.name)
                        }
                      />
                      {showErrors && formState.errors.parties?.[index]?.name && (
                        <p className="text-xs text-rose-600">
                          {t("common.required")}
                        </p>
                      )}
                    </div>
                    <select
                      className="h-10 rounded-lg border border-[var(--border)] bg-[var(--paper)] px-3 text-sm text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--foreground)] focus-visible:ring-offset-2"
                      {...register(`parties.${index}.type`)}
                    >
                      <option value="person">{t("party.type.person")}</option>
                      <option value="organization">{t("party.type.organization")}</option>
                    </select>
                    <select
                      className="h-10 rounded-lg border border-[var(--border)] bg-[var(--paper)] px-3 text-sm text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--foreground)] focus-visible:ring-offset-2"
                      {...register(`parties.${index}.side`)}
                    >
                      <option value="opponent">{t("party.side.opponent")}</option>
                      <option value="third_party">{t("party.side.third_party")}</option>
                      <option value="client">{t("party.side.client")}</option>
                    </select>
                    <select
                      className="h-10 rounded-lg border border-[var(--border)] bg-[var(--paper)] px-3 text-sm text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--foreground)] focus-visible:ring-offset-2"
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
                    <Input
                      placeholder={t("cases.parties.address")}
                      {...register(`parties.${index}.address`)}
                    />
                    <Input
                      placeholder={t("cases.parties.identity")}
                      {...register(`parties.${index}.identity_number`)}
                    />
                  </div>
                  <Input
                    placeholder={t("cases.parties.notes")}
                    {...register(`parties.${index}.notes`)}
                  />
                  <div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => removeParty(index)}
                    >
                      {t("cases.parties.remove")}
                    </Button>
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  appendParty({
                    name: "",
                    type: "person",
                    side: "opponent",
                    role: "respondent",
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
            <CardHeader className="space-y-2">
              <CardTitle>{t("cases.sections.team")}</CardTitle>
              <CardDescription>
                {t("cases.sections.team")}
              </CardDescription>
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
                      aria-invalid={
                        showErrors &&
                        Boolean(formState.errors.participants?.[index]?.user_public_id)
                      }
                    />
                    {showErrors &&
                      formState.errors.participants?.[index]?.user_public_id && (
                        <p className="mt-1 text-xs text-rose-600">
                          {t("common.required")}
                        </p>
                      )}
                    {Boolean(participantQuery[field.id]) && (
                      <div className="absolute z-10 mt-2 max-h-64 w-full overflow-auto rounded-lg border border-[var(--border)] bg-[var(--paper)] shadow-sm">
                        {tenantUsers
                          .filter((member) => {
                            const query =
                              participantQuery[field.id]?.trim().toLowerCase() ??
                              "";
                            if (!query) {
                              return false;
                            }
                            const name = member.name?.toLowerCase() ?? "";
                            const email = member.email?.toLowerCase() ?? "";
                            const matches = name.includes(query) || email.includes(query);
                            const selectedIds = new Set(
                              selectedParticipants
                                .map((participant) => participant?.user_public_id)
                                .filter(Boolean)
                            );
                            const currentId =
                              selectedParticipants[index]?.user_public_id ?? "";
                            if (member.public_id === currentId) {
                              return matches;
                            }
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
                                  member.public_id,
                                  { shouldValidate: true }
                                );
                                setParticipantQuery((prev) => ({
                                  ...prev,
                                  [field.id]: member.email
                                    ? `${member.name} (${member.email})`
                                    : member.name,
                                }));
                              }}
                            >
                              <span className="text-[var(--foreground)]">{member.name}</span>
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
                    className="h-10 rounded-lg border border-[var(--border)] bg-[var(--paper)] px-3 text-sm text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--foreground)] focus-visible:ring-offset-2"
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
                onClick={() => append({ user_public_id: "", role: "associate" })}
              >
                {t("cases.team.add")}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="space-y-2">
              <CardTitle>{t("cases.sections.hearing")}</CardTitle>
              <CardDescription>
                {t("cases.sections.hearing")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="flex items-center gap-2 text-sm text-[var(--muted)]">
                <input
                  type="checkbox"
                  checked={includeFirstHearing}
                  onChange={(event) => setIncludeFirstHearing(event.target.checked)}
                />
                {t("cases.hearing.add")}
              </label>
              {includeFirstHearing && (
                <div className="space-y-4">
                  <TemplatePresetPicker
                    title={t("templates.hearing.title")}
                    description={t("templates.hearing.desc")}
                    locale={locale}
                    templates={HEARING_AGENDA_TEMPLATES}
                    onSelect={(template) =>
                      setValue(
                        "first_hearing.agenda",
                        mergeTemplateText(firstHearingAgendaValue, template),
                        {
                          shouldDirty: true,
                          shouldValidate: true,
                        }
                      )
                    }
                  />
                  <div className="grid gap-4 md:grid-cols-2">
                    <Input
                      type="datetime-local"
                      {...register("first_hearing.hearing_at")}
                    />
                    <select
                      className="h-10 rounded-lg border border-[var(--border)] bg-[var(--paper)] px-3 text-sm text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--foreground)] focus-visible:ring-offset-2"
                      {...register("first_hearing.type")}
                    >
                      <option value="mention">{t("hearing.type.mention")}</option>
                      <option value="hearing">{t("hearing.type.hearing")}</option>
                      <option value="trial">{t("hearing.type.trial")}</option>
                      <option value="order">{t("hearing.type.order")}</option>
                    </select>
                    <Input
                      placeholder={t("cases.hearing.agenda")}
                      {...register("first_hearing.agenda")}
                    />
                    <Input
                      placeholder={t("cases.hearing.location")}
                      {...register("first_hearing.location")}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={createCase.isPending}>
              {createCase.isPending
                ? t("cases.actions.saving")
                : t("cases.actions.create")}
            </Button>
            {Object.keys(formState.errors).length > 0 && (
              <Badge variant="subtle">
                {t("cases.actions.review_required")}
              </Badge>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}
