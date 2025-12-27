"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api-client";
import { useToast } from "@/components/ui/use-toast";
import { useLocale } from "@/components/locale-provider";

export type CourtDivision = {
  public_id: string;
  name: string;
  name_bn: string;
  country_id: number;
};

export type CourtDistrict = {
  public_id: string;
  name: string;
  name_bn: string;
  country_id: number;
  division?: {
    public_id: string;
    name: string;
    name_bn: string;
  };
};

export type CourtType = {
  public_id: string;
  name: string;
  name_bn: string;
  country_id: number;
};

export type Court = {
  public_id: string;
  name: string;
  name_bn: string;
  is_active: boolean;
  country_id: number;
  division?: {
    public_id: string;
    name: string;
    name_bn: string;
  };
  district?: {
    public_id: string;
    name: string;
    name_bn: string;
  };
  court_type?: {
    public_id: string;
    name: string;
    name_bn: string;
  };
};

export type CourtStats = {
  divisions: number;
  districts: number;
  court_types: number;
  courts: number;
};

function buildQuery(params?: Record<string, string | number | undefined>) {
  if (!params) {
    return "";
  }

  const search = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== "")
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join("&");

  return search ? `?${search}` : "";
}

export function useCourtStats(countryId?: number) {
  return useQuery({
    queryKey: ["admin-court-stats", countryId],
    queryFn: () =>
      apiGet<CourtStats>(
        `/api/v1/admin/court-stats${buildQuery({ country_id: countryId })}`
      ),
  });
}

export function useCourtDivisions(countryId?: number) {
  return useQuery({
    queryKey: ["admin-court-divisions", countryId],
    queryFn: () =>
      apiGet<{ data: CourtDivision[] }>(
        `/api/v1/admin/court-divisions${buildQuery({ country_id: countryId })}`
      ).then((res) => res.data),
  });
}

export function useCourtDistricts(
  countryId?: number,
  divisionPublicId?: string
) {
  return useQuery({
    queryKey: ["admin-court-districts", countryId, divisionPublicId],
    queryFn: () =>
      apiGet<{ data: CourtDistrict[] }>(
        `/api/v1/admin/court-districts${buildQuery({
          country_id: countryId,
          division_public_id: divisionPublicId,
        })}`
      ).then((res) => res.data),
  });
}

export function useCourtTypes(countryId?: number) {
  return useQuery({
    queryKey: ["admin-court-types", countryId],
    queryFn: () =>
      apiGet<{ data: CourtType[] }>(
        `/api/v1/admin/court-types${buildQuery({ country_id: countryId })}`
      ).then((res) => res.data),
  });
}

export function useCourts(
  countryId?: number,
  districtPublicId?: string,
  typePublicId?: string
) {
  return useQuery({
    queryKey: ["admin-courts", countryId, districtPublicId, typePublicId],
    queryFn: () =>
      apiGet<{ data: Court[] }>(
        `/api/v1/admin/courts${buildQuery({
          country_id: countryId,
          district_public_id: districtPublicId,
          court_type_public_id: typePublicId,
        })}`
      ).then((res) => res.data),
  });
}

export function useCreateCourtDivision() {
  const client = useQueryClient();
  const { toast } = useToast();
  const { t } = useLocale();

  return useMutation({
    mutationFn: (payload: { country_id: number; name: string; name_bn: string }) =>
      apiPost<CourtDivision>("/api/v1/admin/court-divisions", payload),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["admin-court-divisions"] });
      toast({
        title: t("admin.toast.division_added_title"),
        description: t("admin.toast.division_added_body"),
        variant: "success",
      });
    },
    onError: () => {
      toast({
        title: t("admin.toast.division_failed_title"),
        description: t("admin.toast.division_failed_body"),
        variant: "error",
      });
    },
  });
}

export function useUpdateCourtDivision() {
  const client = useQueryClient();
  const { toast } = useToast();
  const { t } = useLocale();

  return useMutation({
    mutationFn: (payload: { public_id: string; name: string; name_bn: string }) =>
      apiPut<CourtDivision>(`/api/v1/admin/court-divisions/${payload.public_id}`, payload),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["admin-court-divisions"] });
      toast({
        title: t("admin.toast.division_updated_title"),
        description: t("admin.toast.division_updated_body"),
        variant: "success",
      });
    },
    onError: () => {
      toast({
        title: t("admin.toast.division_update_failed_title"),
        description: t("admin.toast.division_update_failed_body"),
        variant: "error",
      });
    },
  });
}

export function useDeleteCourtDivision() {
  const client = useQueryClient();
  const { toast } = useToast();
  const { t } = useLocale();

  return useMutation({
    mutationFn: (publicId: string) =>
      apiDelete(`/api/v1/admin/court-divisions/${publicId}`),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["admin-court-divisions"] });
      toast({
        title: t("admin.toast.division_deleted_title"),
        description: t("admin.toast.division_deleted_body"),
        variant: "success",
      });
    },
    onError: () => {
      toast({
        title: t("admin.toast.division_delete_failed_title"),
        description: t("admin.toast.division_delete_failed_body"),
        variant: "error",
      });
    },
  });
}

export function useCreateCourtDistrict() {
  const client = useQueryClient();
  const { toast } = useToast();
  const { t } = useLocale();

  return useMutation({
    mutationFn: (payload: { division_public_id: string; name: string; name_bn: string }) =>
      apiPost<CourtDistrict>("/api/v1/admin/court-districts", payload),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["admin-court-districts"] });
      toast({
        title: t("admin.toast.district_added_title"),
        description: t("admin.toast.district_added_body"),
        variant: "success",
      });
    },
    onError: () => {
      toast({
        title: t("admin.toast.district_failed_title"),
        description: t("admin.toast.district_failed_body"),
        variant: "error",
      });
    },
  });
}

export function useUpdateCourtDistrict() {
  const client = useQueryClient();
  const { toast } = useToast();
  const { t } = useLocale();

  return useMutation({
    mutationFn: (payload: {
      public_id: string;
      name: string;
      name_bn: string;
      division_public_id?: string;
    }) =>
      apiPut<CourtDistrict>(`/api/v1/admin/court-districts/${payload.public_id}`, payload),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["admin-court-districts"] });
      toast({
        title: t("admin.toast.district_updated_title"),
        description: t("admin.toast.district_updated_body"),
        variant: "success",
      });
    },
    onError: () => {
      toast({
        title: t("admin.toast.district_update_failed_title"),
        description: t("admin.toast.district_update_failed_body"),
        variant: "error",
      });
    },
  });
}

export function useDeleteCourtDistrict() {
  const client = useQueryClient();
  const { toast } = useToast();
  const { t } = useLocale();

  return useMutation({
    mutationFn: (publicId: string) =>
      apiDelete(`/api/v1/admin/court-districts/${publicId}`),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["admin-court-districts"] });
      toast({
        title: t("admin.toast.district_deleted_title"),
        description: t("admin.toast.district_deleted_body"),
        variant: "success",
      });
    },
    onError: () => {
      toast({
        title: t("admin.toast.district_delete_failed_title"),
        description: t("admin.toast.district_delete_failed_body"),
        variant: "error",
      });
    },
  });
}

export function useCreateCourtType() {
  const client = useQueryClient();
  const { toast } = useToast();
  const { t } = useLocale();

  return useMutation({
    mutationFn: (payload: { country_id: number; name: string; name_bn: string }) =>
      apiPost<CourtType>("/api/v1/admin/court-types", payload),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["admin-court-types"] });
      toast({
        title: t("admin.toast.court_type_added_title"),
        description: t("admin.toast.court_type_added_body"),
        variant: "success",
      });
    },
    onError: () => {
      toast({
        title: t("admin.toast.court_type_failed_title"),
        description: t("admin.toast.court_type_failed_body"),
        variant: "error",
      });
    },
  });
}

export function useUpdateCourtType() {
  const client = useQueryClient();
  const { toast } = useToast();
  const { t } = useLocale();

  return useMutation({
    mutationFn: (payload: { public_id: string; name: string; name_bn: string }) =>
      apiPut<CourtType>(`/api/v1/admin/court-types/${payload.public_id}`, payload),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["admin-court-types"] });
      toast({
        title: t("admin.toast.court_type_updated_title"),
        description: t("admin.toast.court_type_updated_body"),
        variant: "success",
      });
    },
    onError: () => {
      toast({
        title: t("admin.toast.court_type_update_failed_title"),
        description: t("admin.toast.court_type_update_failed_body"),
        variant: "error",
      });
    },
  });
}

export function useDeleteCourtType() {
  const client = useQueryClient();
  const { toast } = useToast();
  const { t } = useLocale();

  return useMutation({
    mutationFn: (publicId: string) =>
      apiDelete(`/api/v1/admin/court-types/${publicId}`),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["admin-court-types"] });
      toast({
        title: t("admin.toast.court_type_deleted_title"),
        description: t("admin.toast.court_type_deleted_body"),
        variant: "success",
      });
    },
    onError: () => {
      toast({
        title: t("admin.toast.court_type_delete_failed_title"),
        description: t("admin.toast.court_type_delete_failed_body"),
        variant: "error",
      });
    },
  });
}

export function useCreateCourt() {
  const client = useQueryClient();
  const { toast } = useToast();
  const { t } = useLocale();

  return useMutation({
    mutationFn: (payload: {
      district_public_id: string;
      court_type_public_id: string;
      name: string;
      name_bn: string;
      is_active?: boolean;
    }) => apiPost<Court>("/api/v1/admin/courts", payload),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["admin-courts"] });
      toast({
        title: t("admin.toast.court_added_title"),
        description: t("admin.toast.court_added_body"),
        variant: "success",
      });
    },
    onError: () => {
      toast({
        title: t("admin.toast.court_failed_title"),
        description: t("admin.toast.court_failed_body"),
        variant: "error",
      });
    },
  });
}

export function useUpdateCourt() {
  const client = useQueryClient();
  const { toast } = useToast();
  const { t } = useLocale();

  return useMutation({
    mutationFn: (payload: {
      public_id: string;
      name: string;
      name_bn: string;
      district_public_id?: string;
      court_type_public_id?: string;
      is_active?: boolean;
    }) => apiPut<Court>(`/api/v1/admin/courts/${payload.public_id}`, payload),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["admin-courts"] });
      toast({
        title: t("admin.toast.court_updated_title"),
        description: t("admin.toast.court_updated_body"),
        variant: "success",
      });
    },
    onError: () => {
      toast({
        title: t("admin.toast.court_update_failed_title"),
        description: t("admin.toast.court_update_failed_body"),
        variant: "error",
      });
    },
  });
}

export function useDeleteCourt() {
  const client = useQueryClient();
  const { toast } = useToast();
  const { t } = useLocale();

  return useMutation({
    mutationFn: (publicId: string) => apiDelete(`/api/v1/admin/courts/${publicId}`),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["admin-courts"] });
      toast({
        title: t("admin.toast.court_deleted_title"),
        description: t("admin.toast.court_deleted_body"),
        variant: "success",
      });
    },
    onError: () => {
      toast({
        title: t("admin.toast.court_delete_failed_title"),
        description: t("admin.toast.court_delete_failed_body"),
        variant: "error",
      });
    },
  });
}
