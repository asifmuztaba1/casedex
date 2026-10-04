import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPostForm } from "@/lib/api-client";

export type VoiceStatus = {
  dictation_available: boolean;
  consent_given: boolean;
  max_seconds: number;
  seconds_per_credit: number;
  zero_retention: boolean;
  associate_available?: boolean;
  associate_credits_per_minute?: number;
};

export type Transcription = {
  text: string;
  language_code: string | null;
  duration_seconds: number;
  credits_charged: number;
};

const STATUS_KEY = ["voice-status"];

export function useVoiceStatus() {
  return useQuery({
    queryKey: STATUS_KEY,
    queryFn: () => apiGet<{ data: VoiceStatus }>("/api/v1/voice/status"),
    staleTime: 5 * 60_000,
  });
}

export function useGiveVoiceConsent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiPost<{ data: { consent_given: boolean } }>("/api/v1/voice/consent", {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: STATUS_KEY }),
  });
}

export function useTranscribe() {
  return useMutation({
    mutationFn: ({ audio, seconds }: { audio: Blob; seconds: number }) => {
      const form = new FormData();
      const extension = audio.type.includes("mp4") ? "m4a" : audio.type.includes("ogg") ? "ogg" : "webm";
      form.append("audio", audio, `dictation.${extension}`);
      form.append("duration_seconds", String(Math.max(1, Math.round(seconds))));
      return apiPostForm<{ data: Transcription }>("/api/v1/voice/transcriptions", form);
    },
  });
}

export type AssociateSession = {
  session_public_id: string;
  conversation_token: string;
  max_seconds: number;
  dynamic_variables: Record<string, string>;
};

export function useStartAssociate() {
  return useMutation({
    mutationFn: () => apiPost<{ data: AssociateSession }>("/api/v1/voice/associate/sessions", {}),
  });
}

/** Tells CaseDex the call is over so it can bill the real call length. */
export function endAssociateSession(sessionPublicId: string) {
  return apiPost(`/api/v1/voice/associate/sessions/${sessionPublicId}/end`, {});
}

/** Adds dictated text after what is already in a field. */
export function appendDictation(existing: string, dictated: string): string {
  const text = dictated.trim();
  if (!text) return existing;
  return existing.trim() ? `${existing.trimEnd()}\n${text}` : text;
}
