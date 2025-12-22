"use client";

import EmptyState from "@/components/empty-state";
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
          Research
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">Research notes</h1>
        <p className="text-sm text-slate-600">
          Keep citations and summaries organized for each matter.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add a research note</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-3 md:grid-cols-[1fr_2fr_auto]"
            onSubmit={handleSubmit(onSubmit)}
          >
            <Input
              placeholder="Research note title"
              {...register("title")}
            />
            <Input
              placeholder="Summary (optional)"
              {...register("body")}
            />
            <Button type="submit" disabled={createNote.isPending}>
              {createNote.isPending ? "Saving..." : "Add note"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Loading research notes...
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-rose-200 bg-white p-6 text-sm text-rose-600">
          Unable to load research notes right now.
        </div>
      ) : notes.length === 0 ? (
        <EmptyState
          title="No research notes yet"
          description="Capture a research note to build institutional memory."
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
                        "Update research note",
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
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteNote.mutate(note.public_id)}
                  >
                    Delete
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
