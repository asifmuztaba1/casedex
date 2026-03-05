"use client";

import { useState } from "react";
import EmptyState from "@/components/empty-state";
import PageHeader from "@/components/page-header";
import ConfirmDialog from "@/components/confirm-dialog";
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
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { Pencil, Plus, Trash2 } from "lucide-react";

const schema = z.object({
  title: z.string().min(2),
  body: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function ResearchPage() {
  const { t } = useLocale();
  const { data, isLoading, isError } = useResearchNotes();
  const notes = data?.data ?? [];
  const createNote = useCreateResearchNote();
  const deleteNote = useDeleteResearchNote();
  const updateNote = useUpdateResearchNote();

  const [editingNote, setEditingNote] = useState<{
    publicId: string;
    title: string;
    body: string;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const { register, handleSubmit, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const editForm = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (values: FormValues) => {
    createNote.mutate(values, { onSuccess: () => reset() });
  };

  const onEdit = (values: FormValues) => {
    if (!editingNote) return;
    updateNote.mutate(
      { publicId: editingNote.publicId, data: values },
      { onSuccess: () => setEditingNote(null) }
    );
  };

  return (
    <section className="space-y-6">
      <PageHeader
        title={t("research.title")}
        description={t("research.subtitle")}
      />

      <Card>
        <CardContent className="pt-6">
          <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid gap-3 md:grid-cols-[1fr_2fr]">
              <div>
                <Label>{t("research.note_title_placeholder")}</Label>
                <Input className="mt-1" {...register("title")} />
              </div>
              <div>
                <Label>{t("research.note_summary_placeholder")}</Label>
                <Textarea className="mt-1" rows={2} {...register("body")} />
              </div>
            </div>
            <Button type="submit" disabled={createNote.isPending}>
              <Plus className="mr-1.5 h-4 w-4" />
              {createNote.isPending ? t("research.saving") : t("research.save")}
            </Button>
          </form>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : isError ? (
        <div className="text-sm text-rose-600">{t("research.error")}</div>
      ) : notes.length === 0 ? (
        <EmptyState
          title={t("research.empty_title")}
          description={t("research.empty_desc")}
        />
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <Card key={note.public_id}>
              <CardContent className="flex items-start justify-between gap-4 p-6">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="text-base font-semibold text-slate-900">
                    {note.title}
                  </div>
                  {note.body && (
                    <p className="text-sm text-slate-600">
                      {note.body.slice(0, 300)}
                      {note.body.length > 300 ? "..." : ""}
                    </p>
                  )}
                  <p className="text-xs text-slate-400">
                    {format(new Date(note.created_at), "PP")}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingNote({
                        publicId: note.public_id,
                        title: note.title,
                        body: note.body ?? "",
                      });
                      editForm.reset({
                        title: note.title,
                        body: note.body ?? "",
                      });
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteTarget(note.public_id)}
                  >
                    <Trash2 className="h-4 w-4 text-rose-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog
        open={!!editingNote}
        onOpenChange={(open) => !open && setEditingNote(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("research.edit")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(onEdit)} className="space-y-4">
            <div>
              <Label>{t("research.note_title_placeholder")}</Label>
              <Input className="mt-1" {...editForm.register("title")} />
            </div>
            <div>
              <Label>{t("research.note_summary_placeholder")}</Label>
              <Textarea className="mt-1" rows={4} {...editForm.register("body")} />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                type="button"
                onClick={() => setEditingNote(null)}
              >
                {t("common.cancel") ?? "Cancel"}
              </Button>
              <Button type="submit" disabled={updateNote.isPending}>
                {updateNote.isPending ? "..." : t("research.save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={t("research.delete")}
        description={t("research.delete_confirm") ?? "Are you sure you want to delete this note?"}
        confirmLabel={t("research.delete")}
        onConfirm={() => {
          if (deleteTarget) deleteNote.mutate(deleteTarget);
          setDeleteTarget(null);
        }}
        destructive
      />
    </section>
  );
}
