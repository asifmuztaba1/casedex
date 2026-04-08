"use client";

import { useState, useRef } from "react";
import { useLocale } from "@/components/locale-provider";
import {
  useAdminSupportTickets,
  useAdminTicketMessages,
  useAdminReplyToTicket,
  useAdminUpdateTicketStatus,
  type SupportTicket,
  type TicketStatus,
} from "@/features/support/use-support";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Paperclip,
  Search,
  Send,
  X,
} from "lucide-react";
import { format } from "date-fns";

const STATUS_COLORS: Record<string, string> = {
  open: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  awaiting_reply: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  resolved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  closed: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

const STATUSES: TicketStatus[] = ["open", "awaiting_reply", "resolved", "closed"];

function StatusBadge({ status }: { status: string }) {
  const { t } = useLocale();
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[status] ?? ""}`}>
      {t(`support.status.${status}`)}
    </span>
  );
}

function AdminConversation({
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
  const { data: messagesData, isLoading } = useAdminTicketMessages(ticket.public_id, page);
  const reply = useAdminReplyToTicket(ticket.public_id);
  const updateStatus = useAdminUpdateTicketStatus(ticket.public_id);
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
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <CardTitle className="text-lg">{ticket.subject}</CardTitle>
              <p className="mt-1 text-xs text-[var(--muted)]">
                {t("support.from")}: {ticket.user.name} ({ticket.user.email})
              </p>
              <p className="text-xs text-[var(--muted)]">
                {format(new Date(ticket.created_at), "PPp")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={ticket.status}
                onValueChange={(val) => updateStatus.mutate(val as TicketStatus)}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {t(`support.status.${s}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
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
                        ? "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950"
                        : "border-[var(--border)] bg-[var(--wash)]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-[var(--foreground)]">
                        {msg.user.name}
                        {isPlatform && (
                          <Badge variant="subtle" className="ml-2 text-[10px]">
                            {t("support.staff")}
                          </Badge>
                        )}
                      </span>
                      <span className="text-[11px] text-[var(--muted-soft)]">
                        {format(new Date(msg.created_at), "PPp")}
                      </span>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--foreground)]">
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

          <div className="space-y-2 border-t border-[var(--border)] pt-4">
            <Textarea
              placeholder={t("support.admin_reply_placeholder")}
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
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminSupportPage() {
  const { t } = useLocale();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>("");
  const [search, setSearch] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  const { data, isLoading } = useAdminSupportTickets(
    page,
    status || undefined,
    search || undefined
  );
  const tickets = data?.data ?? [];
  const meta = data?.meta;

  if (selectedTicket) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">
          {t("support.admin_title")}
        </h1>
        <AdminConversation
          ticket={selectedTicket}
          onBack={() => setSelectedTicket(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-[var(--foreground)]">
        {t("support.admin_title")}
      </h1>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-soft)]" />
          <Input
            className="w-[250px] pl-9"
            placeholder={t("support.search_placeholder")}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <Select
          value={status}
          onValueChange={(val) => {
            setStatus(val === "all" ? "" : val);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder={t("support.filter_status")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("support.all_statuses")}</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {t(`support.status.${s}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-[var(--muted)]">{t("support.no_tickets")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <Card
              key={ticket.public_id}
              className="cursor-pointer transition-colors hover:bg-[var(--wash)]"
              onClick={() => setSelectedTicket(ticket)}
            >
              <CardContent className="py-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-[var(--foreground)]">
                        {ticket.subject}
                      </span>
                      <StatusBadge status={ticket.status} />
                    </div>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {ticket.user.name} &middot; {ticket.user.email}
                    </p>
                    {ticket.latest_message && (
                      <p className="mt-1 truncate text-xs text-[var(--muted-soft)]">
                        {ticket.latest_message.user_name}: {ticket.latest_message.body}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 text-xs text-[var(--muted-soft)]">
                    {format(new Date(ticket.created_at), "PP")}
                  </span>
                </div>
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
    </div>
  );
}
