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
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Research
        </p>
        <h1 className="text-3xl font-semibold text-slate-900">Research notes</h1>
        <p className="text-sm text-slate-600">
          Keep citations and summaries organized for each matter.
        </p>
      </header>
      <form
        className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-6 md:grid-cols-[1fr_2fr_auto]"
        onSubmit={handleSubmit(onSubmit)}
      >
        <input
          className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm"
          placeholder="Research note title"
          {...register("title")}
        />
        <input
          className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm"
          placeholder="Summary (optional)"
          {...register("body")}
        />
        <button
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white"
          type="submit"
          disabled={createNote.isPending}
        >
          {createNote.isPending ? "Saving..." : "Add note"}
        </button>
      </form>
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
            <div
              key={note.public_id}
              className="rounded-2xl border border-slate-200 bg-white p-6"
            >
              <div className="text-lg font-semibold text-slate-900">
                {note.title}
              </div>
              {note.body && (
                <p className="mt-2 text-sm text-slate-600">
                  {note.body.slice(0, 180)}
                  {note.body.length > 180 ? "..." : ""}
                </p>
              )}
              <div className="mt-4">
                <button
                  className="mr-4 text-xs font-medium text-slate-700"
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
                </button>
                <button
                  className="text-xs font-medium text-rose-600"
                  onClick={() => deleteNote.mutate(note.public_id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
