"use client";

import { useMemo, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
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
import type { CourtLookup } from "@/features/courts/use-courts";

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
          story: z.string().min(2),
          petition_draft: z.string().min(2),
          client_id: z.preprocess(
            (value) =>
              value === "" || value === undefined ? undefined : Number(value),
            z.number().int().optional()
          ),
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
        }),
    [t]
  );

  type CaseFormValues = z.infer<typeof caseSchema>;

  const { register, handleSubmit, control, formState, setValue, watch } =
    useForm<CaseFormValues>({
      resolver: zodResolver(caseSchema),
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

  const courtValue = watch("court") ?? "";

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
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
          {t("nav.new_case")}
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">
          {t("cases.new.title")}
        </h1>
        <p className="text-sm text-slate-600">
          {t("cases.new.subtitle")}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <Card className="h-fit">
          <CardHeader className="space-y-2">
            <CardTitle className="text-base">{t("cases.sections.title")}</CardTitle>
            <CardDescription>{t("cases.sections.desc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-600">
            <div>1. {t("cases.sections.client")}</div>
            <div>2. {t("cases.sections.basics")}</div>
            <div>3. {t("cases.sections.story")}</div>
            <div>4. {t("cases.sections.petition")}</div>
            <div>5. {t("cases.sections.parties")}</div>
            <div>6. {t("cases.sections.team")}</div>
            <div>7. {t("cases.sections.hearing")}</div>
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
              <label className="flex items-center gap-2 text-sm text-slate-600">
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
                />
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    placeholder={t("cases.client.name")}
                    {...register("client.name")}
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
              <div className="grid gap-3 md:grid-cols-2">
                <select
                  className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
                  {...register("client_party_type")}
                >
                  <option value="person">{t("party.type.person")}</option>
                  <option value="organization">{t("party.type.organization")}</option>
                </select>
                <select
                  className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
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
              <Input placeholder={t("cases.case.title")} {...register("title")} />
              <CourtSelect
                value={courtValue}
                selectedCourt={selectedCourt}
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
              <Input placeholder={t("cases.case.number")} {...register("case_number")} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="space-y-2">
              <CardTitle>{t("cases.sections.story")}</CardTitle>
              <CardDescription>
                {t("cases.story.placeholder")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <textarea
                className="h-32 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
                placeholder={t("cases.story.placeholder")}
                {...register("story")}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="space-y-2">
              <CardTitle>{t("cases.sections.petition")}</CardTitle>
              <CardDescription>
                {t("cases.petition.placeholder")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <textarea
                className="h-32 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
                placeholder={t("cases.petition.placeholder")}
                {...register("petition_draft")}
              />
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
                <p className="text-sm text-slate-600">
                  {t("cases.parties.empty")}
                </p>
              )}
              {partyFields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid gap-3 rounded-2xl border border-slate-200 p-4"
                >
                  <div className="grid gap-3 md:grid-cols-2">
                    <Input
                      placeholder={t("cases.parties.name")}
                      {...register(`parties.${index}.name`)}
                    />
                    <select
                      className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
                      {...register(`parties.${index}.type`)}
                    >
                      <option value="person">{t("party.type.person")}</option>
                      <option value="organization">{t("party.type.organization")}</option>
                    </select>
                    <select
                      className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
                      {...register(`parties.${index}.side`)}
                    >
                      <option value="opponent">{t("party.side.opponent")}</option>
                      <option value="third_party">{t("party.side.third_party")}</option>
                      <option value="client">{t("party.side.client")}</option>
                    </select>
                    <select
                      className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
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
                  <Input
                    placeholder={t("cases.team.user_public_id")}
                    {...register(`participants.${index}.user_public_id`)}
                  />
                  <select
                    className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
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
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={includeFirstHearing}
                  onChange={(event) => setIncludeFirstHearing(event.target.checked)}
                />
                {t("cases.hearing.add")}
              </label>
              {includeFirstHearing && (
                <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    type="datetime-local"
                    {...register("first_hearing.hearing_at")}
                  />
                  <select
                    className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
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
