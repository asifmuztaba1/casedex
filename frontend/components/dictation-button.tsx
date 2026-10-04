"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Mic, Square } from "lucide-react";
import ConfirmDialog from "@/components/confirm-dialog";
import { useLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useGiveVoiceConsent, useTranscribe, useVoiceStatus } from "@/features/voice/use-voice";

const MIME_TYPES = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];

function supportedMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  return MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type));
}

function formatTime(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

/**
 * Speak instead of type: records a short clip, ElevenLabs turns it into text,
 * and the text is added to the field for the lawyer to check before saving.
 * Hidden unless voice is switched on (Admin → Voice).
 */
export default function DictationButton({ onText, label }: { onText: (text: string) => void; label?: string }) {
  const { t } = useLocale();
  const { toast } = useToast();
  const { data } = useVoiceStatus();
  const giveConsent = useGiveVoiceConsent();
  const transcribe = useTranscribe();
  const [askingConsent, setAskingConsent] = useState(false);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const startedAtRef = useRef(0);
  const status = data?.data;

  useEffect(() => () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    recorderRef.current?.stream.getTracks().forEach((track) => track.stop());
  }, []);

  if (!status?.dictation_available) return null;

  const stop = () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
    recorderRef.current?.stop();
    setRecording(false);
  };

  const start = async () => {
    const mimeType = supportedMimeType();
    if (!navigator.mediaDevices?.getUserMedia || mimeType === undefined) {
      toast({ title: t("voice.unsupported"), variant: "error" });
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      toast({ title: t("voice.mic_blocked"), description: t("voice.mic_blocked_desc"), variant: "error" });
      return;
    }

    const recorder = new MediaRecorder(stream, { mimeType });
    chunksRef.current = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.onstop = () => {
      stream.getTracks().forEach((track) => track.stop());
      const elapsed = (Date.now() - startedAtRef.current) / 1000;
      const audio = new Blob(chunksRef.current, { type: recorder.mimeType });
      if (audio.size === 0) return;
      transcribe.mutate(
        { audio, seconds: elapsed },
        {
          onSuccess: ({ data: result }) => {
            if (!result.text) {
              toast({ title: t("voice.nothing_heard"), variant: "error" });
              return;
            }
            onText(result.text);
            toast({
              title: t("voice.added"),
              description: t("voice.added_desc").replace("{credits}", String(result.credits_charged)),
              variant: "success",
            });
          },
          onError: (error) => toast({ title: t("voice.failed"), description: error.message, variant: "error" }),
        }
      );
    };

    recorderRef.current = recorder;
    startedAtRef.current = Date.now();
    setSeconds(0);
    recorder.start();
    setRecording(true);
    timerRef.current = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAtRef.current) / 1000);
      setSeconds(elapsed);
      if (elapsed >= status.max_seconds) stop();
    }, 250);
  };

  const onClick = () => {
    if (recording) {
      stop();
    } else if (!status.consent_given) {
      setAskingConsent(true);
    } else {
      void start();
    }
  };

  return (
    <>
      <Button
        type="button"
        variant={recording ? "default" : "outline"}
        size="sm"
        onClick={onClick}
        disabled={transcribe.isPending}
        aria-label={recording ? t("voice.stop_label").replace("{time}", formatTime(seconds)) : label ?? t("voice.dictate")}
      >
        {transcribe.isPending ? (
          <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" aria-hidden />
        ) : recording ? (
          <Square className="mr-1 h-3.5 w-3.5" aria-hidden />
        ) : (
          <Mic className="mr-1 h-3.5 w-3.5" aria-hidden />
        )}
        {transcribe.isPending
          ? t("voice.transcribing")
          : recording
            ? `${t("voice.stop")} ${formatTime(seconds)} / ${formatTime(status.max_seconds)}`
            : label ?? t("voice.dictate")}
      </Button>
      <ConfirmDialog
        open={askingConsent}
        onOpenChange={setAskingConsent}
        title={t("voice.consent_title")}
        description={(status.zero_retention ? t("voice.consent_zero_retention") : t("voice.consent_body")).replace(
          "{minutes}",
          String(Math.round(status.seconds_per_credit / 60))
        )}
        confirmLabel={t("voice.consent_agree")}
        cancelLabel={t("common.cancel")}
        onConfirm={() =>
          giveConsent.mutate(undefined, {
            onSuccess: () => void start(),
            onError: (error) => toast({ title: t("voice.failed"), description: error.message, variant: "error" }),
          })
        }
      />
    </>
  );
}
