"use client";

import { useState, useRef } from "react";
import PageHeader from "@/components/page-header";
import { useLocale } from "@/components/locale-provider";
import {
  useSupportTickets,
  useSupportTicket,
  useTicketMessages,
  useCreateTicket,
  useReplyToTicket,
  type SupportTicket,
} from "@/features/support/use-support";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Compass,
  MessageSquarePlus,
  Paperclip,
  Send,
  X,
} from "lucide-react";
import { useProductTour } from "@/components/tour-provider";
import { format } from "date-fns";

const STATUS_COLORS: Record<string, string> = {
  open: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  awaiting_reply: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  resolved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  closed: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

function StatusBadge({ status }: { status: string }) {
  const { t } = useLocale();
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[status] ?? ""}`}>
      {t(`support.status.${status}`)}
    </span>
  );
}

function TicketConversation({
  ticket,
  onBack,
}: {
  ticket: SupportTicket;
  onBack: () => void;
}) {
  const { t } = useLocale();
  const [page, setPage] = useState(1);
  const [replyBody, setReplyBody] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { data: messagesData, isLoading } = useTicketMessages(ticket.public_id, page);
  const reply = useReplyToTicket(ticket.public_id);
  const messages = messagesData?.data ?? [];
  const meta = messagesData?.meta;

  const handleReply = () => {
    if (!replyBody.trim()) return;
    reply.mutate(
      { body: replyBody, attachment: attachment ?? undefined },
      {
        onSuccess: () => {
          setReplyBody("");
          setAttachment(null);
        },
      }
    );
  };

  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
      >
        <ArrowLeft className="h-4 w-4" /> {t("support.back_to_tickets")}
      </button>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-lg">{ticket.subject}</CardTitle>
            <p className="mt-1 text-xs text-[var(--muted)]">
              {format(new Date(ticket.created_at), "PPp")}
            </p>
          </div>
          <StatusBadge status={ticket.status} />
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg) => {
                const isPlatform = msg.user.role === "platform_admin" || msg.user.role === "platform_editor";
                return (
                  <div
                    key={msg.public_id}
                    className={`rounded-xl border p-3 ${
                      isPlatform
                        ? "border-blue-300 bg-blue-50 text-blue-900 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-100"
                        : "border-[var(--border)] bg-[var(--wash)]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-medium ${isPlatform ? "" : "text-[var(--foreground)]"}`}>
                        {msg.user.name}
                        {isPlatform && (
                          <Badge variant="subtle" className="ml-2 text-[10px]">
                            {t("support.staff")}
                          </Badge>
                        )}
                      </span>
                      <span className={`text-[11px] ${isPlatform ? "opacity-60" : "text-[var(--muted-soft)]"}`}>
                        {format(new Date(msg.created_at), "PPp")}
                      </span>
                    </div>
                    <p className={`mt-1 whitespace-pre-wrap text-sm ${isPlatform ? "" : "text-[var(--foreground)]"}`}>
                      {msg.body}
                    </p>
                    {msg.attachment_name && (
                      <a
                        href={msg.attachment_url ?? "#"}
                        className="mt-2 inline-flex items-center gap-1 text-xs text-blue-600 underline-offset-4 hover:underline"
                      >
                        <Paperclip className="h-3 w-3" /> {msg.attachment_name}
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {meta && meta.last_page > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs text-[var(--muted)]">
                {page} / {meta.last_page}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= meta.last_page}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {ticket.status !== "closed" && ticket.status !== "resolved" && (
            <div className="space-y-2 border-t border-[var(--border)] pt-4">
              <Textarea
                placeholder={t("support.reply_placeholder")}
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                rows={3}
              />
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <input
                    ref={fileRef}
                    type="file"
                    className="hidden"
                    accept="image/*,.pdf"
                    onChange={(e) => setAttachment(e.target.files?.[0] ?? null)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileRef.current?.click()}
                  >
                    <Paperclip className="mr-1 h-3 w-3" /> {t("support.attach")}
                  </Button>
                  {attachment && (
                    <span className="flex items-center gap-1 text-xs text-[var(--muted)]">
                      {attachment.name}
                      <button onClick={() => setAttachment(null)}>
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                </div>
                <Button
                  size="sm"
                  onClick={handleReply}
                  disabled={reply.isPending || !replyBody.trim()}
                >
                  <Send className="mr-1 h-3 w-3" /> {t("support.send")}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function SupportPage() {
  const { t } = useLocale();
  const [page, setPage] = useState(1);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { data, isLoading } = useSupportTickets(page);
  const { start: startTour } = useProductTour();
  const { data: selectedTicketData } = useSupportTicket(selectedTicketId ?? "");
  const createTicket = useCreateTicket();
  const tickets = data?.data ?? [];
  const meta = data?.meta;

  const handleCreate = () => {
    if (!subject.trim() || !body.trim()) return;
    createTicket.mutate(
      { subject, body, attachment: attachment ?? undefined },
      {
        onSuccess: () => {
          setShowCreate(false);
          setSubject("");
          setBody("");
          setAttachment(null);
        },
      }
    );
  };

  if (selectedTicketId && selectedTicketData?.data) {
    return (
      <section className="space-y-6">
        <PageHeader title={t("support.title")} description={t("support.desc")} />
        <TicketConversation
          ticket={selectedTicketData.data}
          onBack={() => setSelectedTicketId(null)}
        />
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <PageHeader title={t("support.title")} description={t("support.desc")} />

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={startTour}>
          <Compass className="mr-2 h-4 w-4" />
          {t("tour.btn.replay")}
        </Button>
        <Button onClick={() => setShowCreate(true)}>
          <MessageSquarePlus className="mr-2 h-4 w-4" />
          {t("support.new_ticket")}
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-[var(--muted)]">{t("support.empty")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <Card
              key={ticket.public_id}
              className="cursor-pointer transition-colors hover:bg-[var(--wash)]"
              onClick={() => setSelectedTicketId(ticket.public_id)}
            >
              <CardContent className="flex items-center justify-between gap-4 py-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-[var(--foreground)]">
                      {ticket.subject}
                    </span>
                    <StatusBadge status={ticket.status} />
                  </div>
                  {ticket.latest_message && (
                    <p className="mt-1 truncate text-xs text-[var(--muted)]">
                      {ticket.latest_message.user_name}: {ticket.latest_message.body}
                    </p>
                  )}
                </div>
                <span className="shrink-0 text-xs text-[var(--muted-soft)]">
                  {format(new Date(ticket.created_at), "PP")}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {meta && meta.last_page > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs text-[var(--muted)]">
            {page} / {meta.last_page}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= meta.last_page}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("support.new_ticket")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-soft)]">
                {t("support.subject")}
              </label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={t("support.subject_placeholder")}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-soft)]">
                {t("support.details")}
              </label>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={t("support.details_placeholder")}
                rows={5}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-soft)]">
                {t("support.screenshot")}
              </label>
              <div className="flex items-center gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  className="hidden"
                  accept="image/*,.pdf"
                  onChange={(e) => setAttachment(e.target.files?.[0] ?? null)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileRef.current?.click()}
                >
                  <Paperclip className="mr-1 h-3 w-3" /> {t("support.attach")}
                </Button>
                {attachment && (
                  <span className="flex items-center gap-1 text-xs text-[var(--muted)]">
                    {attachment.name}
                    <button onClick={() => setAttachment(null)}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createTicket.isPending || !subject.trim() || !body.trim()}
            >
              {createTicket.isPending ? t("common.saving") : t("support.submit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
