"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ConversationProvider, useConversation } from "@elevenlabs/react";
import { Check, Headphones, Loader2, PhoneOff, X } from "lucide-react";
import AiVerifyNotice from "@/components/ai-verify-notice";
import ConfirmDialog from "@/components/confirm-dialog";
import { useLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { apiPost, apiPut } from "@/lib/api-client";
import {
  createAssociateTools,
  dhakaDateTime,
  type AssociateDraft,
  type DiaryDraft,
  type HearingDraft,
} from "@/features/voice/associate-tools";
import {
  endAssociateSession,
  useGiveVoiceConsent,
  useStartAssociate,
  useVoiceStatus,
  type VoiceStatus,
} from "@/features/voice/use-voice";

type Line = { id: number; from: "you" | "associate"; text: string };

/**
 * The voice junior associate (beta firms only): a spoken conversation that can
 * read the lawyer's hearings and cases and prepare drafts. Drafts appear here
 * and are saved only when the lawyer confirms them.
 */
export default function VoiceAssociate() {
  const { data } = useVoiceStatus();
  const status = data?.data;
  if (!status?.associate_available) return null;

  return (
    <ConversationProvider>
      <AssociatePanel status={status} />
    </ConversationProvider>
  );
}

function AssociatePanel({ status }: { status: VoiceStatus }) {
  const { t } = useLocale();
  const { toast } = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();
  const startCall = useStartAssociate();
  const giveConsent = useGiveVoiceConsent();
  const [open, setOpen] = useState(false);
  const [askingConsent, setAskingConsent] = useState(false);
  const [lines, setLines] = useState<Line[]>([]);
  const [drafts, setDrafts] = useState<AssociateDraft[]>([]);
  const sessionRef = useRef<string | null>(null);
  const timerRef = useRef<number | null>(null);
  const lineId = useRef(0);

  const tools = useMemo(
    () =>
      createAssociateTools({
        onDraft: (draft) => setDrafts((prev) => [...prev, draft]),
        openCase: (casePublicId) => router.push(`/cases/${casePublicId}`),
      }),
    [router]
  );

  /** Lets CaseDex bill the real call length; safe to call more than once. */
  const finish = useCallback(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = null;
    const session = sessionRef.current;
    sessionRef.current = null;
    if (session) void endAssociateSession(session).catch(() => undefined);
  }, []);

  const conversation = useConversation({
    clientTools: tools,
    onMessage: ({ message, source }) => {
      if (!message.trim()) return;
      setLines((prev) => [...prev.slice(-30), { id: ++lineId.current, from: source === "user" ? "you" : "associate", text: message }]);
    },
    onDisconnect: () => finish(),
    onError: (message) => toast({ title: t("associate.call_failed"), description: String(message), variant: "error" }),
  });
  const { endSession, sendContextualUpdate } = conversation;
  const endSessionRef = useRef(endSession);
  useEffect(() => {
    endSessionRef.current = endSession;
  }, [endSession]);

  // Leaving the workspace ends the call (a closed tab is billed by the scheduler).
  useEffect(
    () => () => {
      endSessionRef.current();
      finish();
    },
    [finish]
  );

  const live = conversation.status === "connected" || conversation.status === "connecting";

  const begin = async () => {
    try {
      const { data: session } = await startCall.mutateAsync();
      sessionRef.current = session.session_public_id;
      setLines([]);
      conversation.startSession({
        conversationToken: session.conversation_token,
        connectionType: "webrtc",
        dynamicVariables: session.dynamic_variables,
      });
      timerRef.current = window.setTimeout(() => endSessionRef.current(), session.max_seconds * 1000);
    } catch (error) {
      finish();
      toast({
        title: t("associate.call_failed"),
        description: error instanceof Error ? error.message : undefined,
        variant: "error",
      });
    }
  };

  const onStart = () => (status.consent_given ? void begin() : setAskingConsent(true));

  const hangUp = () => {
    endSession();
    finish();
  };

  const settle = (draft: AssociateDraft, saved: boolean) => {
    setDrafts((prev) => prev.filter((item) => item.id !== draft.id));
    if (conversation.status === "connected") {
      sendContextualUpdate(
        saved
          ? `The lawyer reviewed and saved the ${draft.kind === "diary" ? "diary entry" : "hearing update"} for "${draft.case_title}".`
          : `The lawyer discarded the ${draft.kind === "diary" ? "diary entry" : "hearing update"} draft for "${draft.case_title}". Nothing was saved.`
      );
    }
  };

  const save = async (draft: AssociateDraft) => {
    try {
      if (draft.kind === "diary") {
        await apiPost(`/api/v1/cases/${draft.case_public_id}/diary`, {
          entry_at: dhakaDateTime(new Date()),
          title: draft.title,
          body: draft.body,
        });
        queryClient.invalidateQueries({ queryKey: ["diary-entries"] });
      } else {
        if (draft.hearing_public_id && (draft.outcome || draft.minutes)) {
          await apiPut(`/api/v1/hearings/${draft.hearing_public_id}`, {
            ...(draft.outcome ? { outcome: draft.outcome } : {}),
            ...(draft.minutes ? { minutes: draft.minutes } : {}),
          });
        }
        if (draft.next_hearing_at) {
          await apiPost(`/api/v1/cases/${draft.case_public_id}/hearings`, { hearing_at: draft.next_hearing_at, type: "hearing" });
        }
        queryClient.invalidateQueries({ queryKey: ["hearings"] });
      }
      queryClient.invalidateQueries({ queryKey: ["cases", draft.case_public_id] });
      toast({ title: t("associate.saved"), description: draft.case_title, variant: "success" });
      settle(draft, true);
    } catch (error) {
      toast({ title: t("associate.save_failed"), description: error instanceof Error ? error.message : undefined, variant: "error" });
    }
  };

  const update = (next: AssociateDraft) => setDrafts((prev) => prev.map((item) => (item.id === next.id ? next : item)));

  const perMinute = status.associate_credits_per_minute ?? 2;

  return (
    <div className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] left-4 z-40 flex flex-col items-start gap-3 lg:bottom-6 lg:left-[276px] print:hidden">
      {open && (
        <section
          aria-label={t("associate.title")}
          className="flex max-h-[70vh] w-[calc(100vw-2rem)] max-w-sm flex-col gap-3 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--paper)] p-4 shadow-lg"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-[var(--foreground)]">{t("associate.title")}</h2>
              <p className="text-xs text-[var(--muted)]">
                {conversation.status === "connecting"
                  ? t("associate.connecting")
                  : conversation.status === "connected"
                    ? conversation.isSpeaking
                      ? t("associate.speaking")
                      : t("associate.listening")
                    : t("associate.beta")}
              </p>
            </div>
            <button
              type="button"
              aria-label={t("common.close")}
              onClick={() => setOpen(false)}
              className="rounded p-1 text-[var(--muted-soft)] hover:bg-[var(--paper-hover)]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {!live && lines.length === 0 && drafts.length === 0 && (
            <div className="space-y-2 text-xs text-[var(--muted)]">
              <p>{t("associate.intro")}</p>
              <p>{t("associate.cost").replace("{credits}", String(perMinute))}</p>
            </div>
          )}

          {lines.length > 0 && (
            <ol aria-live="polite" className="space-y-2 text-sm">
              {lines.map((line) => (
                <li key={line.id} className={line.from === "you" ? "text-[var(--muted)]" : "text-[var(--foreground)]"}>
                  <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-[var(--muted-soft)]">
                    {line.from === "you" ? t("associate.you") : t("associate.associate")}
                  </span>
                  {line.text}
                </li>
              ))}
            </ol>
          )}

          {drafts.length > 0 && (
            <div className="space-y-3">
              <AiVerifyNotice feature="voice_associate" />
              {drafts.map((draft) =>
                draft.kind === "diary" ? (
                  <DiaryDraftCard key={draft.id} draft={draft} onChange={update} onSave={save} onDiscard={() => settle(draft, false)} />
                ) : (
                  <HearingDraftCard key={draft.id} draft={draft} onChange={update} onSave={save} onDiscard={() => settle(draft, false)} />
                )
              )}
            </div>
          )}

          {live ? (
            <Button type="button" variant="outline" onClick={hangUp}>
              <PhoneOff className="mr-2 h-4 w-4" aria-hidden />
              {t("associate.end")}
            </Button>
          ) : (
            <Button type="button" onClick={onStart} disabled={startCall.isPending}>
              {startCall.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : <Headphones className="mr-2 h-4 w-4" aria-hidden />}
              {t("associate.start")}
            </Button>
          )}
        </section>
      )}

      <Button
        type="button"
        variant={live ? "default" : "outline"}
        className="rounded-full shadow-md"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Headphones className="mr-2 h-4 w-4" aria-hidden />
        {live ? t("associate.on_call") : t("associate.open")}
        {drafts.length > 0 && <span className="ml-2 rounded-full bg-[var(--wash)] px-1.5 text-xs text-[var(--foreground)]">{drafts.length}</span>}
      </Button>

      <ConfirmDialog
        open={askingConsent}
        onOpenChange={setAskingConsent}
        title={t("associate.consent_title")}
        description={t(status.zero_retention ? "associate.consent_zero_retention" : "associate.consent_body").replace(
          "{credits}",
          String(perMinute)
        )}
        confirmLabel={t("associate.consent_agree")}
        cancelLabel={t("common.cancel")}
        onConfirm={() =>
          giveConsent.mutate(undefined, {
            onSuccess: () => void begin(),
            onError: (error) => toast({ title: t("associate.call_failed"), description: error.message, variant: "error" }),
          })
        }
      />
    </div>
  );
}

type CardProps<T extends AssociateDraft> = {
  draft: T;
  onChange(draft: T): void;
  onSave(draft: T): Promise<void>;
  onDiscard(): void;
};

type DraftActionsProps = {
  onSave(): Promise<void>;
  onDiscard(): void;
  disabled?: boolean;
};

function DraftActions({ onSave, onDiscard, disabled }: DraftActionsProps) {
  const { t } = useLocale();
  const [saving, setSaving] = useState(false);

  return (
    <div className="flex gap-2">
      <Button
        type="button"
        size="sm"
        disabled={disabled || saving}
        onClick={async () => {
          setSaving(true);
          await onSave();
          setSaving(false);
        }}
      >
        {saving ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" aria-hidden /> : <Check className="mr-1 h-3.5 w-3.5" aria-hidden />}
        {t("associate.confirm_save")}
      </Button>
      <Button type="button" size="sm" variant="outline" onClick={onDiscard} disabled={saving}>
        {t("associate.discard")}
      </Button>
    </div>
  );
}

function DiaryDraftCard({ draft, onChange, onSave, onDiscard }: CardProps<DiaryDraft>) {
  const { t } = useLocale();

  return (
    <article className="space-y-2 rounded-lg border border-[var(--border)] p-3">
      <p className="text-xs font-semibold text-[var(--muted-soft)]">
        {t("associate.draft_diary")} · {draft.case_title}
      </p>
      <Input aria-label={t("associate.field_title")} value={draft.title} onChange={(e) => onChange({ ...draft, title: e.target.value })} />
      <Textarea aria-label={t("associate.field_note")} value={draft.body} onChange={(e) => onChange({ ...draft, body: e.target.value })} />
      <DraftActions onSave={() => onSave(draft)} onDiscard={onDiscard} disabled={!draft.title.trim() || !draft.body.trim()} />
    </article>
  );
}

function HearingDraftCard({ draft, onChange, onSave, onDiscard }: CardProps<HearingDraft>) {
  const { t } = useLocale();
  const hasHearing = Boolean(draft.hearing_public_id);

  return (
    <article className="space-y-2 rounded-lg border border-[var(--border)] p-3">
      <p className="text-xs font-semibold text-[var(--muted-soft)]">
        {t("associate.draft_hearing")} · {draft.case_title}
        {draft.hearing_at && ` · ${draft.hearing_at.slice(0, 16).replace("T", " ")}`}
      </p>
      {hasHearing && (
        <>
          <Textarea aria-label={t("associate.field_outcome")} placeholder={t("associate.field_outcome")} value={draft.outcome} onChange={(e) => onChange({ ...draft, outcome: e.target.value })} />
          <Textarea aria-label={t("associate.field_minutes")} placeholder={t("associate.field_minutes")} value={draft.minutes} onChange={(e) => onChange({ ...draft, minutes: e.target.value })} />
        </>
      )}
      <label className="block space-y-1 text-xs text-[var(--muted)]">
        <span>{t("associate.field_next_hearing")}</span>
        <Input type="datetime-local" value={draft.next_hearing_at} onChange={(e) => onChange({ ...draft, next_hearing_at: e.target.value })} />
      </label>
      <DraftActions
        onSave={() => onSave(draft)}
        onDiscard={onDiscard}
        disabled={!draft.next_hearing_at && !(hasHearing && (draft.outcome.trim() || draft.minutes.trim()))}
      />
    </article>
  );
}
