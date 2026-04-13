"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useLocale } from "@/components/locale-provider";
import { useSubmitFeedback, type FeedbackTrigger } from "@/features/feedback/use-feedback";

interface FeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: FeedbackTrigger;
}

export default function FeedbackModal({ open, onOpenChange, trigger }: FeedbackModalProps) {
  const { t } = useLocale();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const submitFeedback = useSubmitFeedback();

  const displayRating = hoveredRating || rating;

  function handleDismiss(isOpen: boolean) {
    if (!isOpen) {
      if (typeof window !== "undefined" && !submitFeedback.isSuccess) {
        window.localStorage.setItem(`casedex_feedback_dismissed_${trigger}`, "true");
      }
      setRating(0);
      setHoveredRating(0);
      setComment("");
    }
    onOpenChange(isOpen);
  }

  function handleSubmit() {
    if (rating === 0) return;
    submitFeedback.mutate(
      { rating, comment: comment.trim() || undefined, trigger },
      {
        onSuccess: () => {
          setRating(0);
          setComment("");
          onOpenChange(false);
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleDismiss}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("feedback.title")}</DialogTitle>
          <DialogDescription>{t("feedback.description")}</DialogDescription>
        </DialogHeader>

        <div className="flex justify-center gap-2 py-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className="rounded-md p-1 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              aria-label={`${star} ${t("feedback.star_label")}`}
            >
              <Star
                className={`h-8 w-8 transition-colors ${
                  star <= displayRating
                    ? "fill-amber-400 text-amber-400"
                    : "text-[var(--muted-soft)]"
                }`}
              />
            </button>
          ))}
        </div>

        <Textarea
          placeholder={t("feedback.comment_placeholder")}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          maxLength={2000}
        />

        <DialogFooter>
          <Button variant="outline" onClick={() => handleDismiss(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={rating === 0 || submitFeedback.isPending}
          >
            {submitFeedback.isPending ? t("feedback.submitting") : t("feedback.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
