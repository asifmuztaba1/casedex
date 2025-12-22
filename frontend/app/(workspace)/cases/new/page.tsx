"use client";

import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateCase } from "@/features/cases/use-cases";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const participantSchema = z.object({
  user_public_id: z.string().min(2),
  role: z.enum(["lead_lawyer", "lawyer", "associate", "assistant", "viewer"]),
});

const caseSchema = z
  .object({
  title: z.string().min(2),
  court: z.string().min(2),
  case_number: z.string().optional(),
  story: z.string().min(2),
  petition_draft: z.string().min(2),
  client_id: z.preprocess(
    (value) => (value === \"\" || value === undefined ? undefined : Number(value)),
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
        message: "Client details are required.",
        path: ["client", "name"],
      });
    }
  });

type CaseFormValues = z.infer<typeof caseSchema>;

export default function NewCasePage() {
  const router = useRouter();
  const createCase = useCreateCase();
  const [useExistingClient, setUseExistingClient] = useState(false);
  const [includeFirstHearing, setIncludeFirstHearing] = useState(false);

  const { register, handleSubmit, control, formState } =
    useForm<CaseFormValues>({
      resolver: zodResolver(caseSchema),
      defaultValues: {
        participants: [
          {
            user_public_id: "",
            role: "lead_lawyer",
          },
        ],
      },
    });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "participants",
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
        <p className="text-sm uppercase tracking-wide text-slate-500">
          New case
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">
          Structured case intake
        </h1>
        <p className="text-sm text-slate-600">
          Capture client details, case basics, and the first hearing in one
          place.
        </p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader className="space-y-2">
            <CardTitle>Client</CardTitle>
            <p className="text-sm text-slate-600">
              Select an existing client or enter new client details.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={useExistingClient}
                onChange={(event) => setUseExistingClient(event.target.checked)}
              />
              Use existing client ID
            </label>

            {useExistingClient ? (
              <Input placeholder="Client ID" {...register("client_id")} />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                <Input placeholder="Client name" {...register("client.name")} />
                <Input placeholder="Phone" {...register("client.phone")} />
                <Input placeholder="Email" {...register("client.email")} />
                <Input placeholder="Address" {...register("client.address")} />
                <Input
                  placeholder="NID or passport"
                  {...register("client.identity_number")}
                />
                <Input placeholder="Notes" {...register("client.notes")} />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-2">
            <CardTitle>Case basics</CardTitle>
            <p className="text-sm text-slate-600">
              Title, court, and reference details for the matter.
            </p>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Input placeholder="Case title" {...register("title")} />
            <Input placeholder="Court" {...register("court")} />
            <Input placeholder="Case number" {...register("case_number")} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-2">
            <CardTitle>Story and intake notes</CardTitle>
            <p className="text-sm text-slate-600">
              Summarize the story so the team has shared context.
            </p>
          </CardHeader>
          <CardContent>
            <textarea
              className="h-32 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
              placeholder="Story and intake notes"
              {...register("story")}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-2">
            <CardTitle>Petition draft</CardTitle>
            <p className="text-sm text-slate-600">
              Keep the latest draft accessible to the entire case team.
            </p>
          </CardHeader>
          <CardContent>
            <textarea
              className="h-32 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
              placeholder="Petition draft"
              {...register("petition_draft")}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-2">
            <CardTitle>Team</CardTitle>
            <p className="text-sm text-slate-600">
              Add participants and assign a role for the case.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="grid gap-3 md:grid-cols-[2fr_1fr_auto]"
              >
                <Input
                  placeholder="User public ID"
                  {...register(`participants.${index}.user_public_id`)}
                />
                <select
                  className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
                  {...register(`participants.${index}.role`)}
                >
                  <option value="lead_lawyer">Lead lawyer</option>
                  <option value="lawyer">Lawyer</option>
                  <option value="associate">Associate</option>
                  <option value="assistant">Assistant</option>
                  <option value="viewer">Viewer</option>
                </select>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => remove(index)}
                >
                  Remove
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => append({ user_public_id: "", role: "associate" })}
            >
              Add participant
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-2">
            <CardTitle>First hearing</CardTitle>
            <p className="text-sm text-slate-600">
              Schedule the first hearing now or add it later.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={includeFirstHearing}
                onChange={(event) => setIncludeFirstHearing(event.target.checked)}
              />
              Add first hearing details
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
                  <option value="mention">Mention</option>
                  <option value="hearing">Hearing</option>
                  <option value="trial">Trial</option>
                  <option value="order">Order</option>
                </select>
                <Input placeholder="Agenda" {...register("first_hearing.agenda")} />
                <Input
                  placeholder="Location"
                  {...register("first_hearing.location")}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={createCase.isPending}>
            {createCase.isPending ? "Saving..." : "Create case"}
          </Button>
          {Object.keys(formState.errors).length > 0 && (
            <Badge variant="subtle">Please review required fields</Badge>
          )}
        </div>
      </form>
    </section>
  );
}
