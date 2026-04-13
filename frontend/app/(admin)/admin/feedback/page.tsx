"use client";

import { useState } from "react";
import { useLocale } from "@/components/locale-provider";
import { useAdminFeedback } from "@/features/feedback/use-feedback";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Search, Star } from "lucide-react";
import { format } from "date-fns";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= rating
              ? "fill-amber-400 text-amber-400"
              : "text-[var(--muted-soft)]"
          }`}
        />
      ))}
    </div>
  );
}

const TRIGGER_LABELS: Record<string, string> = {
  trial_reminder: "Trial Reminder",
  first_case: "First Case",
  manual: "Manual",
};

export default function AdminFeedbackPage() {
  const { t } = useLocale();
  const [page, setPage] = useState(1);
  const [rating, setRating] = useState<string>("");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useAdminFeedback(
    page,
    rating ? Number(rating) : undefined,
    search || undefined,
  );
  const feedbackList = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-[var(--foreground)]">
        {t("feedback.admin_title")}
      </h1>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-soft)]" />
          <Input
            className="w-[250px] pl-9"
            placeholder={t("feedback.search_placeholder")}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <Select
          value={rating}
          onValueChange={(val) => {
            setRating(val === "all" ? "" : val);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder={t("feedback.filter_rating")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("feedback.all_ratings")}</SelectItem>
            {[5, 4, 3, 2, 1].map((r) => (
              <SelectItem key={r} value={String(r)}>
                {r} {r === 1 ? t("feedback.star_label") : t("feedback.stars_label")}
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
      ) : feedbackList.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-[var(--muted)]">{t("feedback.no_feedback")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {feedbackList.map((fb) => (
            <Card key={fb.public_id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-[var(--foreground)]">
                        {fb.user.name}
                      </span>
                      <span className="text-xs text-[var(--muted)]">
                        {fb.user.email}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <StarRating rating={fb.rating} />
                      <span className="rounded-full bg-[var(--wash)] px-2 py-0.5 text-[10px] font-medium text-[var(--muted)]">
                        {TRIGGER_LABELS[fb.trigger] ?? fb.trigger}
                      </span>
                    </div>
                    {fb.comment && (
                      <p className="text-sm text-[var(--foreground)]">{fb.comment}</p>
                    )}
                  </div>
                  <span className="shrink-0 text-xs text-[var(--muted-soft)]">
                    {format(new Date(fb.created_at), "PP")}
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
