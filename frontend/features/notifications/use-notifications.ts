import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api-client";
import { useToast } from "@/components/ui/use-toast";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  return "Something went wrong.";
}

export type NotificationSummary = {
  public_id: string;
  case_id: number | null;
  case_public_id?: string | null;
  case_title?: string | null;
  hearing_id: number | null;
  user_id: number | null;
  notification_type: string | null;
  channel: string | null;
  title: string;
  body: string | null;
  status: string;
  scheduled_for: string | null;
  sent_at: string | null;
  created_at: string;
};

type NotificationListResponse = {
  data: NotificationSummary[];
};

export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: () => apiGet<NotificationListResponse>("/api/v1/notifications"),
  });
}

type CreateNotificationPayload = {
  case_public_id?: string;
  hearing_public_id?: string;
  user_public_id?: string;
  notification_type?: string;
  channel?: string;
  title: string;
  body?: string;
  scheduled_for?: string;
};

export function useCreateNotification() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: CreateNotificationPayload) =>
      apiPost<NotificationSummary>("/api/v1/notifications", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast({
        title: "Notification saved",
        description: "The notification was created.",
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: "Notification failed",
        description: getErrorMessage(error),
        variant: "error",
      });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (publicId: string) =>
      apiDelete(`/api/v1/notifications/${publicId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast({
        title: "Notification removed",
        description: "The notification was deleted.",
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: "Delete failed",
        description: getErrorMessage(error),
        variant: "error",
      });
    },
  });
}

type UpdateNotificationPayload = {
  publicId: string;
  data: Partial<CreateNotificationPayload>;
};

export function useUpdateNotification() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ publicId, data }: UpdateNotificationPayload) =>
      apiPut<NotificationSummary>(`/api/v1/notifications/${publicId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast({
        title: "Notification updated",
        description: "Changes saved successfully.",
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: getErrorMessage(error),
        variant: "error",
      });
    },
  });
}
