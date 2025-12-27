"use client";

import EmptyState from "@/components/empty-state";
import { useLocale } from "@/components/locale-provider";
import {
  useCreateResearchNote,
  useDeleteResearchNote,
  useResearchNotes,
  useUpdateResearchNote,
} from "@/features/research/use-research-notes";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function ResearchPage() {
  const { t } = useLocale();
  const { data, isLoading, isError } = useResearchNotes();
  const notes = data?.data ?? [];
  const createNote = useCreateResearchNote();
  const deleteNote = useDeleteResearchNote();
  const updateNote = useUpdateResearchNote();

  const schema = z.object({
    title: z.string().min(2),
    body: z.string().optional(),
  });

  type FormValues = z.infer<typeof schema>;

  const { register, handleSubmit, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (values: FormValues) => {
    createNote.mutate(values, {
      onSuccess: () => reset(),
    });
  };

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
          {t("research.kicker")}
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">
          {t("research.title")}
        </h1>
        <p className="text-sm text-slate-600">
          {t("research.subtitle")}
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t("research.card_title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-3 md:grid-cols-[1fr_2fr_auto]"
            onSubmit={handleSubmit(onSubmit)}
          >
            <Input
              placeholder={t("research.note_title_placeholder")}
              {...register("title")}
            />
            <Input
              placeholder={t("research.note_summary_placeholder")}
              {...register("body")}
            />
            <Button type="submit" disabled={createNote.isPending}>
              {createNote.isPending ? t("research.saving") : t("research.save")}
            </Button>
          </form>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          {t("research.loading")}
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-rose-200 bg-white p-6 text-sm text-rose-600">
          {t("research.error")}
        </div>
      ) : notes.length === 0 ? (
        <EmptyState
          title={t("research.empty_title")}
          description={t("research.empty_desc")}
        />
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <Card key={note.public_id}>
              <CardContent className="space-y-2 p-6">
                <div className="text-base font-semibold text-slate-900">
                  {note.title}
                </div>
                {note.body && (
                  <p className="text-sm text-slate-600">
                    {note.body.slice(0, 180)}
                    {note.body.length > 180 ? "..." : ""}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const body = window.prompt(
                        t("research.update_prompt"),
                        note.body ?? ""
                      );
                      if (body === null) {
                        return;
                      }
                      updateNote.mutate({
                        publicId: note.public_id,
                        data: { body },
                      });
                    }}
                  >
                    {t("research.edit")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteNote.mutate(note.public_id)}
                  >
                    {t("research.delete")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
