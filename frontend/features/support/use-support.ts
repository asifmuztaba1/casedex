import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPostForm } from "@/lib/api-client";
import { useToast } from "@/components/ui/use-toast";

export type TicketStatus = "open" | "awaiting_reply" | "resolved" | "closed";

export type SupportTicket = {
  public_id: string;
  subject: string;
  status: TicketStatus;
  user: { public_id: string; name: string; email: string };
  assignee?: { public_id: string; name: string } | null;
  latest_message?: {
    body: string;
    user_name: string;
    created_at: string;
  } | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type SupportMessage = {
  public_id: string;
  body: string;
  user: { public_id: string; name: string; role: string | null };
  attachment_name: string | null;
  attachment_mime: string | null;
  attachment_size: number | null;
  attachment_url: string | null;
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

export function useSupportTickets(page = 1) {
  return useQuery({
    queryKey: ["support-tickets", page],
    queryFn: () =>
      apiGet<PaginatedResponse<SupportTicket>>(
        `/api/v1/support/tickets?page=${page}&per_page=10`
      ),
  });
}

export function useSupportTicket(publicId: string) {
  return useQuery({
    queryKey: ["support-tickets", publicId],
    queryFn: () =>
      apiGet<{ data: SupportTicket }>(
        `/api/v1/support/tickets/${publicId}`
      ),
    enabled: Boolean(publicId),
  });
}

export function useTicketMessages(publicId: string, page = 1) {
  return useQuery({
    queryKey: ["support-tickets", publicId, "messages", page],
    queryFn: () =>
      apiGet<PaginatedResponse<SupportMessage>>(
        `/api/v1/support/tickets/${publicId}/messages?page=${page}&per_page=20`
      ),
    enabled: Boolean(publicId),
  });
}

export function useCreateTicket() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: { subject: string; body: string; attachment?: File }) => {
      const formData = new FormData();
      formData.append("subject", payload.subject);
      formData.append("body", payload.body);
      if (payload.attachment) {
        formData.append("attachment", payload.attachment);
      }
      return apiPostForm<{ data: SupportTicket }>(
        "/api/v1/support/tickets",
        formData
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
      toast({
        title: "Ticket submitted",
        description: "Our team will respond shortly.",
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to submit ticket",
        description: error instanceof Error ? error.message : "Something went wrong.",
        variant: "error",
      });
    },
  });
}

export function useReplyToTicket(publicId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: { body: string; attachment?: File }) => {
      const formData = new FormData();
      formData.append("body", payload.body);
      if (payload.attachment) {
        formData.append("attachment", payload.attachment);
      }
      return apiPostForm<{ data: SupportMessage }>(
        `/api/v1/support/tickets/${publicId}/messages`,
        formData
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["support-tickets", publicId, "messages"],
      });
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to send reply",
        description: error instanceof Error ? error.message : "Something went wrong.",
        variant: "error",
      });
    },
  });
}

// Admin hooks

export function useAdminSupportTickets(page = 1, status?: string, search?: string) {
  const params = new URLSearchParams({ page: String(page), per_page: "15" });
  if (status) params.set("status", status);
  if (search) params.set("search", search);

  return useQuery({
    queryKey: ["admin-support-tickets", page, status, search],
    queryFn: () =>
      apiGet<PaginatedResponse<SupportTicket>>(
        `/api/v1/admin/support/tickets?${params.toString()}`
      ),
  });
}

export function useAdminTicketMessages(publicId: string, page = 1) {
  return useQuery({
    queryKey: ["admin-support-tickets", publicId, "messages", page],
    queryFn: () =>
      apiGet<PaginatedResponse<SupportMessage>>(
        `/api/v1/admin/support/tickets/${publicId}/messages?page=${page}&per_page=20`
      ),
    enabled: Boolean(publicId),
  });
}

export function useAdminReplyToTicket(publicId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { body: string; attachment?: File }) => {
      const formData = new FormData();
      formData.append("body", payload.body);
      if (payload.attachment) {
        formData.append("attachment", payload.attachment);
      }
      return apiPostForm<{ data: SupportMessage }>(
        `/api/v1/admin/support/tickets/${publicId}/messages`,
        formData
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin-support-tickets", publicId, "messages"],
      });
      queryClient.invalidateQueries({ queryKey: ["admin-support-tickets"] });
    },
  });
}

export function useAdminUpdateTicketStatus(publicId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (status: TicketStatus) =>
      apiPost<{ data: SupportTicket }>(
        `/api/v1/admin/support/tickets/${publicId}/status`,
        { status }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-support-tickets"] });
      toast({
        title: "Status updated",
        variant: "success",
      });
    },
  });
}
