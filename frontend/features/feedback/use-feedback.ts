import { useMutation, useQuery } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api-client";
import { useToast } from "@/components/ui/use-toast";
import { useLocale } from "@/components/locale-provider";

export type FeedbackTrigger = "trial_reminder" | "first_case" | "manual";

export type Feedback = {
  public_id: string;
  rating: number;
  comment: string | null;
  trigger: FeedbackTrigger;
  user: { public_id: string; name: string; email: string };
  created_at: string;
};

type PaginatedResponse<T> = {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};

export function useSubmitFeedback() {
  const { toast } = useToast();
  const { t } = useLocale();

  return useMutation({
    mutationFn: async (payload: {
      rating: number;
      comment?: string;
      trigger: FeedbackTrigger;
    }) => {
      const res = await apiPost<{ data: Feedback }>("/api/v1/feedback", payload);
      return res.data;
    },
    onSuccess: (_data, variables) => {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          `casedex_feedback_submitted_${variables.trigger}`,
          "true",
        );
      }
      toast({
        title: t("feedback.thanks_title"),
        description: t("feedback.thanks_description"),
        variant: "success",
      });
    },
    onError: () => {
      toast({
        title: t("common.error"),
        description: t("common.try_again"),
        variant: "error",
      });
    },
  });
}

export function useAdminFeedback(
  page = 1,
  rating?: number,
  search?: string,
) {
  const params = new URLSearchParams({ page: String(page), per_page: "15" });
  if (rating) params.set("rating", String(rating));
  if (search) params.set("search", search);

  return useQuery({
    queryKey: ["admin-feedback", page, rating ?? "all", search ?? ""],
    queryFn: () =>
      apiGet<PaginatedResponse<Feedback>>(
        `/api/v1/admin/feedback?${params.toString()}`,
      ),
  });
}
