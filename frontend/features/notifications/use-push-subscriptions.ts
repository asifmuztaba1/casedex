import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPost } from "@/lib/api-client";

export type PushSubscriptionSummary = {
  endpoint: string;
  endpoint_hash: string;
  content_encoding: string | null;
  created_at: string;
  last_used_at: string | null;
};

type PushSubscriptionListResponse = {
  data: PushSubscriptionSummary[];
};

type SavePushSubscriptionPayload = {
  endpoint: string;
  p256dh_key: string;
  auth_key: string;
  content_encoding?: string;
  user_agent?: string;
};

export function usePushSubscriptions() {
  return useQuery({
    queryKey: ["push-subscriptions"],
    queryFn: () =>
      apiGet<PushSubscriptionListResponse>("/api/v1/push-subscriptions"),
  });
}

export function useSavePushSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SavePushSubscriptionPayload) =>
      apiPost<PushSubscriptionSummary>("/api/v1/push-subscriptions", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["push-subscriptions"] });
    },
  });
}

export function useDeletePushSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (endpointHash: string) =>
      apiDelete(`/api/v1/push-subscriptions/${endpointHash}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["push-subscriptions"] });
    },
  });
}
