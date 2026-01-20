"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import EmptyState from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth, useUsers } from "@/features/auth/use-auth";
import {
  useCaseDetail,
  useUpdateCase,
} from "@/features/cases/use-cases";
import CourtSelect from "@/components/court-select";
import {
  useAddCaseParticipant,
  useCaseParticipants,
  useRemoveCaseParticipant,
} from "@/features/cases/use-case-participants";
import {
  useAddCaseParty,
  useCaseParties,
  useRemoveCaseParty,
} from "@/features/cases/use-case-parties";
import {
  useCaseHearings,
  useCreateHearing,
} from "@/features/hearings/use-hearings";
import {
  useCaseDiaryEntries,
  useCreateDiaryEntry,
} from "@/features/diary/use-diary-entries";
import {
  useCaseDocuments,
  useCreateDocument,
} from "@/features/documents/use-documents";
import { useLocale } from "@/components/locale-provider";
import type { CourtLookup } from "@/features/courts/use-courts";

// Make option arrays literal so we can derive union types from them.
const statusOptions = ["open", "active", "closed", "archived"] as const;
const hearingTypes = ["mention", "hearing", "trial", "order"] as const;
const documentCategories = [
  "petition",
  "evidence",
  "order_sheet",
  "client_id",
  "notes",
  "other",
] as const;
const partyTypes = ["person", "organization"] as const;
const partySides = ["client", "opponent", "third_party"] as const;
const partyRoles = [
  "petitioner",
  "respondent",
  "appellant",
  "defendant",
  "claimant",
  "plaintiff",
  "applicant",
  "accused",
  "state",
  "other",
] as const;

type PartyType = (typeof partyTypes)[number];
type PartySide = (typeof partySides)[number];
type PartyRole = (typeof partyRoles)[number];

export default function CaseDetailPage() {
  const params = useParams();
  const casePublicId = String(params?.publicId ?? "");
  const { data: user } = useAuth();
  const { t, locale } = useLocale();
  const { data, isLoading, isError } = useCaseDetail(casePublicId);
  const caseDetail = data ?? null;

  const { data: hearingsData } = useCaseHearings(casePublicId);
  const { data: diaryData } = useCaseDiaryEntries(casePublicId);
  const { data: documentsData } = useCaseDocuments(casePublicId);
  const { data: participantsData } = useCaseParticipants(casePublicId);
  const { data: partiesData } = useCaseParties(casePublicId);

  const hearings = hearingsData?.data ?? [];
  const diaryEntries = diaryData?.data ?? [];
  const documents = documentsData?.data ?? [];
  const participants = participantsData?.data ?? caseDetail?.participants ?? [];
  const parties = partiesData?.data ?? caseDetail?.parties ?? [];

  const updateCase = useUpdateCase();
  const createHearing = useCreateHearing();
  const createDiary = useCreateDiaryEntry();
  const createDocument = useCreateDocument();
  const addParticipant = useAddCaseParticipant();
  const removeParticipant = useRemoveCaseParticipant();
  const addParty = useAddCaseParty();
  const removeParty = useRemoveCaseParty();

  const recentDiaryEntries = caseDetail?.recent_diary_entries ?? [];
  const recentDocuments = caseDetail?.recent_documents ?? [];

  const [hearingForm, setHearingForm] = useState({
    hearing_at: "",
    type: "hearing",
    agenda: "",
    location: "",
    outcome: "",
    minutes: "",
    next_steps: "",
  });
  const [hearingSubmitted, setHearingSubmitted] = useState(false);

  const [diaryForm, setDiaryForm] = useState({
    entry_at: "",
    title: "",
    body: "",
    hearing_public_id: "",
  });
  const [diarySubmitted, setDiarySubmitted] = useState(false);

  const [documentForm, setDocumentForm] = useState<{
    category: string;
    file: File | null;
    name_base: string;
    extension: string;
    hearing_public_id: string;
  }>({
    category: "petition",
    file: null,
    name_base: "",
    extension: "",
    hearing_public_id: "",
  });
  const [documentSubmitted, setDocumentSubmitted] = useState(false);

  const [participantForm, setParticipantForm] = useState({
    user_public_id: "",
    role: "assistant",
  });
  const [participantQuery, setParticipantQuery] = useState("");
  const [participantSubmitted, setParticipantSubmitted] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const [partyForm, setPartyForm] = useState<{
    name: string;
    type: PartyType;
    side: PartySide;
    role: PartyRole;
    phone: string;
    email: string;
    address: string;
    identity_number: string;
    notes: string;
  }>({
    name: "",
    type: "person",
    side: "opponent",
    role: "respondent",
    phone: "",
    email: "",
    address: "",
    identity_number: "",
    notes: "",
  });
  const [partySubmitted, setPartySubmitted] = useState(false);

  const [editForm, setEditForm] = useState({
    title: caseDetail?.title ?? "",
    court: caseDetail?.court ?? "",
    court_public_id: caseDetail?.court_public_id ?? undefined,
    case_number: caseDetail?.case_number ?? "",
    status: caseDetail?.status ?? "open",
    story: caseDetail?.story ?? "",
    petition_draft: caseDetail?.petition_draft ?? "",
  });
  const [selectedCourt, setSelectedCourt] = useState<CourtLookup | null>(null);

  useEffect(() => {
    if (!caseDetail) {
      return;
    }

    setEditForm({
      title: caseDetail.title ?? "",
      court: caseDetail.court ?? "",
      court_public_id: caseDetail.court_public_id ?? undefined,
      case_number: caseDetail.case_number ?? "",
      status: caseDetail.status ?? "open",
      story: caseDetail.story ?? "",
      petition_draft: caseDetail.petition_draft ?? "",
    });
    setSelectedCourt(null);
  }, [caseDetail]);

  const canManageParticipants = useMemo(() => {
    if (!user || !caseDetail) {
      return false;
    }
    if (user.role === "admin") {
      return true;
    }
    return (
      caseDetail.participants?.some(
        (participant) =>
          participant.user?.public_id === user.public_id &&
          participant.role === "lead_lawyer"
      ) ?? false
    );
  }, [caseDetail, user]);

  const hearingDateError = hearingSubmitted && !hearingForm.hearing_at;
  const diaryDateError = diarySubmitted && !diaryForm.entry_at;
  const diaryTitleError = diarySubmitted && !diaryForm.title.trim();
  const diaryBodyError = diarySubmitted && !diaryForm.body.trim();
  const documentFileError = documentSubmitted && !documentForm.file;
  const participantError =
    participantSubmitted && !participantForm.user_public_id;
  const partyNameError = partySubmitted && !partyForm.name.trim();

  const { data: usersData } = useUsers(canManageParticipants);
  const tenantUsers = usersData ?? [];

  const participantOptions = useMemo(() => {
    const existing = new Set(
      participants
        .map((participant) => participant.user?.public_id)
        .filter(Boolean)
    );

    return tenantUsers.filter((member) => !existing.has(member.public_id));
  }, [participants, tenantUsers]);

  const filteredParticipantOptions = useMemo(() => {
    const query = participantQuery.trim().toLowerCase();
    if (!query) {
      return [];
    }

    return participantOptions.filter((member) => {
      const name = member.name?.toLowerCase() ?? "";
      const email = member.email?.toLowerCase() ?? "";
      return name.includes(query) || email.includes(query);
    });
  }, [participantOptions, participantQuery]);

  if (isLoading) {
    return <div className="text-sm text-slate-600">{t("common.loading")}</div>;
  }

  if (isError || !caseDetail) {
    return (
      <div className="text-sm text-rose-600">{t("common.error_loading")}</div>
    );
  }

  const nextHearing = caseDetail.upcoming_hearings?.[0];
  const caseTitle =
    caseDetail.title && caseDetail.title.trim().length > 0
      ? caseDetail.title
      : t("common.case");
  const courtLabel = caseDetail.court ?? t("cases.list.court_pending");
  const caseNumberLabel =
    caseDetail.case_number ?? t("cases.list.case_number_pending");

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
            {t("case.detail.workspace")}
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">
            {caseTitle}
          </h1>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600">
            <span>{courtLabel}</span>
            <span className="text-slate-400">•</span>
            <span>{caseNumberLabel}</span>
            <Badge variant="subtle" className="capitalize">
              {caseDetail.status
                ? t(`case.status.${caseDetail.status}`)
                : t("case.status.open")}
            </Badge>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline">{t("case.detail.edit")}</Button>
            </SheetTrigger>
            <SheetContent className="w-[420px]">
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold">
                    {t("case.detail.edit_title")}
                  </h2>
                  <p className="text-sm text-slate-600">
                    {t("case.detail.edit_desc")}
                  </p>
                </div>
                <div className="space-y-3">
                  <Input
                    value={editForm.title}
                    onChange={(event) =>
                      setEditForm((prev) => ({
                        ...prev,
                        title: event.target.value,
                      }))
                    }
                    placeholder={t("case.detail.case_title_placeholder")}
                  />
                  <div className="grid gap-3 md:grid-cols-2">
                    <CourtSelect
                      value={editForm.court}
                      selectedCourt={selectedCourt}
                      onValueChange={(value) => {
                        setSelectedCourt(null);
                        setEditForm((prev) => ({
                          ...prev,
                          court: value,
                          court_public_id: undefined,
                        }));
                      }}
                      onSelect={(court) => {
                        setSelectedCourt(court);
                        setEditForm((prev) => ({
                          ...prev,
                          court: court
                            ? locale === "bn"
                              ? court.name_bn
                              : court.name
                            : "",
                          court_public_id: court?.public_id,
                        }));
                      }}
                    />
                    <Input
                      value={editForm.case_number}
                      onChange={(event) =>
                        setEditForm((prev) => ({
                          ...prev,
                          case_number: event.target.value,
                        }))
                      }
                      placeholder={t("case.detail.case_number_placeholder")}
                    />
                  </div>
                  <select
                    className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900"
                    value={editForm.status}
                    onChange={(event) =>
                      setEditForm((prev) => ({
                        ...prev,
                        status: event.target.value,
                      }))
                    }
                  >
                    {statusOptions.map((option) => (
                      <option key={option} value={option}>
                        {t(`case.status.${option}`)}
                      </option>
                    ))}
                  </select>
                  <textarea
                    className="h-28 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                    value={editForm.story}
                    onChange={(event) =>
                      setEditForm((prev) => ({
                        ...prev,
                        story: event.target.value,
                      }))
                    }
                    placeholder={t("cases.story.placeholder")}
                  />
                  <textarea
                    className="h-28 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                    value={editForm.petition_draft}
                    onChange={(event) =>
                      setEditForm((prev) => ({
                        ...prev,
                        petition_draft: event.target.value,
                      }))
                    }
                    placeholder={t("cases.petition.placeholder")}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() =>
                      updateCase.mutate({
                        publicId: casePublicId,
                        data: {
                          ...editForm,
                          court_public_id: editForm.court_public_id ?? undefined,
                        },
                      })
                    }
                    disabled={updateCase.isPending}
                  >
                    {updateCase.isPending
                      ? t("case.detail.saving")
                      : t("case.detail.save_changes")}
                  </Button>
                  <SheetClose asChild>
                    <Button variant="outline">{t("common.cancel")}</Button>
                  </SheetClose>
                </div>
              </div>
            </SheetContent>
          </Sheet>
          <Sheet>
            <SheetTrigger asChild>
              <Button>{t("case.detail.add_hearing")}</Button>
            </SheetTrigger>
            <SheetContent className="w-[420px]">
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold">
                    {t("case.detail.add_hearing_title")}
                  </h2>
                  <p className="text-sm text-slate-600">
                    {t("case.detail.hearing_prompt")}
                  </p>
                </div>
                <div className="space-y-3">
                  <Input
                    type="datetime-local"
                    value={hearingForm.hearing_at}
                    onChange={(event) =>
                      setHearingForm((prev) => ({
                        ...prev,
                        hearing_at: event.target.value,
                      }))
                    }
                    aria-invalid={hearingDateError}
                  />
                  {hearingDateError && (
                    <p className="text-xs text-rose-600">{t("common.required")}</p>
                  )}
                  <select
                    className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900"
                    value={hearingForm.type}
                    onChange={(event) =>
                      setHearingForm((prev) => ({
                        ...prev,
                        type: event.target.value,
                      }))
                    }
                  >
                    {hearingTypes.map((option) => (
                      <option key={option} value={option}>
                        {t(`hearing.type.${option}`)}
                      </option>
                    ))}
                  </select>
                  <Input
                    placeholder={t("hearing.agenda")}
                    value={hearingForm.agenda}
                    onChange={(event) =>
                      setHearingForm((prev) => ({
                        ...prev,
                        agenda: event.target.value,
                      }))
                    }
                  />
                  <Input
                    placeholder={t("case.detail.location_placeholder")}
                    value={hearingForm.location}
                    onChange={(event) =>
                      setHearingForm((prev) => ({
                        ...prev,
                        location: event.target.value,
                      }))
                    }
                  />
                  <Input
                    placeholder={t("hearing.outcome_optional")}
                    value={hearingForm.outcome}
                    onChange={(event) =>
                      setHearingForm((prev) => ({
                        ...prev,
                        outcome: event.target.value,
                      }))
                    }
                  />
                  <textarea
                    className="h-24 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                    placeholder={t("hearing.minutes")}
                    value={hearingForm.minutes}
                    onChange={(event) =>
                      setHearingForm((prev) => ({
                        ...prev,
                        minutes: event.target.value,
                      }))
                    }
                  />
                  <textarea
                    className="h-24 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                    placeholder={t("hearing.next_steps")}
                    value={hearingForm.next_steps}
                    onChange={(event) =>
                      setHearingForm((prev) => ({
                        ...prev,
                        next_steps: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => {
                      setHearingSubmitted(true);
                      if (!hearingForm.hearing_at) {
                        return;
                      }
                      createHearing.mutate(
                        {
                          case_public_id: casePublicId,
                          hearing_at: hearingForm.hearing_at,
                          type: hearingForm.type,
                          agenda: hearingForm.agenda,
                          location: hearingForm.location,
                          outcome: hearingForm.outcome,
                          minutes: hearingForm.minutes,
                          next_steps: hearingForm.next_steps,
                        },
                        {
                          onSuccess: () => {
                            setHearingSubmitted(false);
                          },
                        }
                      );
                    }}
                    disabled={createHearing.isPending}
                  >
                    {createHearing.isPending
                      ? t("case.detail.saving")
                      : t("case.detail.add_hearing_title")}
                  </Button>
                  <SheetClose asChild>
                    <Button variant="outline">{t("common.cancel")}</Button>
                  </SheetClose>
                </div>
              </div>
            </SheetContent>
          </Sheet>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline">{t("case.detail.add_diary")}</Button>
            </SheetTrigger>
            <SheetContent className="w-[420px]">
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold">
                    {t("case.detail.add_diary_title")}
                  </h2>
                  <p className="text-sm text-slate-600">
                    {t("case.detail.diary_prompt")}
                  </p>
                </div>
                <div className="space-y-3">
                  <Input
                    type="datetime-local"
                    value={diaryForm.entry_at}
                    onChange={(event) =>
                      setDiaryForm((prev) => ({
                        ...prev,
                        entry_at: event.target.value,
                      }))
                    }
                    aria-invalid={diaryDateError}
                  />
                  {diaryDateError && (
                    <p className="text-xs text-rose-600">{t("common.required")}</p>
                  )}
                  <Input
                    placeholder={t("diary.entry_title")}
                    value={diaryForm.title}
                    onChange={(event) =>
                      setDiaryForm((prev) => ({
                        ...prev,
                        title: event.target.value,
                      }))
                    }
                    aria-invalid={diaryTitleError}
                  />
                  {diaryTitleError && (
                    <p className="text-xs text-rose-600">{t("common.required")}</p>
                  )}
                  <select
                    className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900"
                    value={diaryForm.hearing_public_id}
                    onChange={(event) =>
                      setDiaryForm((prev) => ({
                        ...prev,
                        hearing_public_id: event.target.value,
                      }))
                    }
                  >
                    <option value="">{t("diary.link_hearing")}</option>
                    {hearings.map((hearing) => (
                      <option key={hearing.public_id} value={hearing.public_id}>
                        {hearing.hearing_at
                          ? format(new Date(hearing.hearing_at), "PPpp")
                          : t("hearing.type.hearing")}
                      </option>
                    ))}
                  </select>
                  <textarea
                    className={`h-28 w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 ${
                      diaryBodyError
                        ? "border-rose-500"
                        : "border-slate-200"
                    }`}
                    placeholder={t("diary.body")}
                    value={diaryForm.body}
                    onChange={(event) =>
                      setDiaryForm((prev) => ({
                        ...prev,
                        body: event.target.value,
                      }))
                    }
                  />
                  {diaryBodyError && (
                    <p className="text-xs text-rose-600">{t("common.required")}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => {
                      setDiarySubmitted(true);
                      if (!diaryForm.entry_at || !diaryForm.title.trim() || !diaryForm.body.trim()) {
                        return;
                      }
                      createDiary.mutate(
                        {
                          case_public_id: casePublicId,
                          entry_at: diaryForm.entry_at,
                          title: diaryForm.title,
                          body: diaryForm.body,
                          hearing_public_id:
                            diaryForm.hearing_public_id || undefined,
                        },
                        {
                          onSuccess: () => {
                            setDiarySubmitted(false);
                          },
                        }
                      );
                    }}
                    disabled={createDiary.isPending}
                  >
                    {createDiary.isPending
                      ? t("case.detail.saving")
                      : t("common.add")}
                  </Button>
                  <SheetClose asChild>
                    <Button variant="outline">{t("common.cancel")}</Button>
                  </SheetClose>
                </div>
              </div>
            </SheetContent>
          </Sheet>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline">{t("case.detail.upload_document")}</Button>
            </SheetTrigger>
            <SheetContent className="w-[420px]">
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold">
                    {t("case.detail.upload_document_title")}
                  </h2>
                  <p className="text-sm text-slate-600">
                    {t("document.allowed_types")}
                  </p>
                </div>
                <div className="space-y-3">
                  <select
                    className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900"
                    value={documentForm.category}
                    onChange={(event) =>
                      setDocumentForm((prev) => ({
                        ...prev,
                        category: event.target.value,
                      }))
                    }
                  >
                    {documentCategories.map((category) => (
                      <option key={category} value={category}>
                        {t(`document.category.${category}`)}
                      </option>
                    ))}
                  </select>
                  <select
                    className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900"
                    value={documentForm.hearing_public_id}
                    onChange={(event) =>
                      setDocumentForm((prev) => ({
                        ...prev,
                        hearing_public_id: event.target.value,
                      }))
                    }
                  >
                    <option value="">{t("document.link_hearing")}</option>
                    {hearings.map((hearing) => (
                      <option key={hearing.public_id} value={hearing.public_id}>
                        {hearing.hearing_at
                          ? format(new Date(hearing.hearing_at), "PPpp")
                          : t("hearing.type.hearing")}
                      </option>
                    ))}
                  </select>
                  <Input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(event) =>
                      setDocumentForm((prev) => ({
                        ...prev,
                        file: event.target.files?.[0] ?? null,
                        name_base: (() => {
                          const name = event.target.files?.[0]?.name ?? "";
                          const lastDot = name.lastIndexOf(".");
                          return lastDot > 0 ? name.slice(0, lastDot) : name;
                        })(),
                        extension: (() => {
                          const name = event.target.files?.[0]?.name ?? "";
                          const lastDot = name.lastIndexOf(".");
                          return lastDot > 0 ? name.slice(lastDot + 1) : "";
                        })(),
                      }))
                    }
                    aria-invalid={documentFileError}
                  />
                  {documentFileError && (
                    <p className="text-xs text-rose-600">{t("common.required")}</p>
                  )}
                  <div className="flex items-center gap-2">
                    <Input
                      value={documentForm.name_base}
                      onChange={(event) =>
                        setDocumentForm((prev) => ({
                          ...prev,
                          name_base: event.target.value,
                        }))
                      }
                      placeholder={t("document.name_placeholder")}
                    />
                    {documentForm.extension ? (
                      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                        .{documentForm.extension}
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => {
                      setDocumentSubmitted(true);
                      if (!documentForm.file) {
                        return;
                      }
                      createDocument.mutate(
                        {
                          case_public_id: casePublicId,
                          category: documentForm.category,
                          file: documentForm.file,
                          original_name: documentForm.extension
                            ? `${documentForm.name_base || "document"}.${documentForm.extension}`
                            : documentForm.name_base || undefined,
                          hearing_public_id:
                            documentForm.hearing_public_id || undefined,
                        },
                        {
                          onSuccess: () => {
                            setDocumentSubmitted(false);
                          },
                        }
                      );
                    }}
                    disabled={createDocument.isPending || !documentForm.file}
                  >
                    {createDocument.isPending
                      ? t("case.detail.saving")
                      : t("common.upload")}
                  </Button>
                  <SheetClose asChild>
                    <Button variant="outline">{t("common.cancel")}</Button>
                  </SheetClose>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">{t("case.detail.tabs.overview")}</TabsTrigger>
          <TabsTrigger value="hearings">{t("case.detail.tabs.hearings")}</TabsTrigger>
          <TabsTrigger value="diary">{t("case.detail.tabs.diary")}</TabsTrigger>
          <TabsTrigger value="documents">{t("case.detail.tabs.documents")}</TabsTrigger>
          <TabsTrigger value="participants">{t("case.detail.tabs.participants")}</TabsTrigger>
          <TabsTrigger value="parties">{t("case.detail.tabs.parties")}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6 lg:grid-cols-3 mb-2 mt-2">
            <Card>
              <CardHeader>
                <CardTitle>{t("case.detail.client")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-slate-600">
                {caseDetail.client ? (
                  <>
                    <div className="text-sm font-semibold text-slate-900">
                      {caseDetail.client.name}
                    </div>
                    <div>
                      {caseDetail.client.phone ??
                        t("cases.client.phone_pending")}
                    </div>
                    <div>
                      {caseDetail.client.email ??
                        t("cases.client.email_pending")}
                    </div>
                    <div>
                      {caseDetail.client.address ??
                        t("cases.client.address_pending")}
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-slate-600">
                    {t("case.detail.no_client")}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("case.detail.next_hearing")}</CardTitle>
                <CardDescription>{t("dashboard.section.hearings_desc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-slate-600">
                {nextHearing ? (
                  <>
                    <div className="text-sm font-semibold text-slate-900">
                      {nextHearing.hearing_at
                        ? format(new Date(nextHearing.hearing_at), "PPpp")
                        : t("common.tbd")}
                    </div>
                    <div className="capitalize">
                      {nextHearing.type
                        ? t(`hearing.type.${nextHearing.type}`)
                        : t("hearing.type.hearing")}
                    </div>
                    <div>{nextHearing.agenda ?? t("hearing.agenda_pending")}</div>
                  </>
                ) : (
                  <div>{t("case.detail.no_hearings")}</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("case.detail.petition")}</CardTitle>
                <CardDescription>{t("cases.sections.petition")}</CardDescription>
              </CardHeader>
              <CardContent>
                {caseDetail.petition_draft ? (
                  <details className="text-sm text-slate-600">
                    <summary className="cursor-pointer text-sm font-medium text-slate-900">
                      {t("case.detail.preview_draft")}
                    </summary>
                    <p className="mt-2 whitespace-pre-wrap">
                      {caseDetail.petition_draft}
                    </p>
                  </details>
                ) : (
                  <div className="text-sm text-slate-600">
                    {t("case.detail.petition_empty")}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

            <div className="mb-2">
                          <Card>
            <CardHeader>
              <CardTitle>{t("case.detail.story")}</CardTitle>
              <CardDescription>{t("cases.sections.story")}</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-slate-600">
              {caseDetail.story ? (
                <p className="whitespace-pre-wrap">{caseDetail.story}</p>
              ) : (
                <p>{t("case.detail.no_story")}</p>
              )}
            </CardContent>
          </Card>
            </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle>{t("case.detail.recent_diary")}</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab("diary")}
                  >
                    {t("case.detail.see_all_diary")}
                  </Button>
                </div>
                <CardDescription>{t("dashboard.section.diary_desc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentDiaryEntries.length === 0 ? (
                  <EmptyState
                    title={t("case.detail.diary_empty_title")}
                    description={t("case.detail.diary_empty_desc")}
                  />
                ) : (
                  recentDiaryEntries.map((entry) => (
                    <div key={entry.public_id} className="space-y-1">
                      <div className="text-sm font-medium text-slate-900">
                        {entry.title ?? "Diary entry"}
                      </div>
                      <div className="text-xs text-slate-500">
                        {entry.entry_at
                          ? format(new Date(entry.entry_at), "PP")
                          : ""}
                      </div>
                      <div className="text-sm text-slate-600">
                        {entry.body ?? ""}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle>{t("case.detail.recent_documents")}</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab("documents")}
                  >
                    {t("case.detail.see_all_documents")}
                  </Button>
                </div>
                <CardDescription>{t("dashboard.section.documents_desc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentDocuments.length === 0 ? (
                  <EmptyState
                    title={t("case.detail.documents_empty_title")}
                    description={t("case.detail.documents_empty_desc")}
                  />
                ) : (
                  recentDocuments.map((doc) => (
                    <div key={doc.public_id} className="space-y-1">
                      <div className="text-sm font-medium text-slate-900">
                        {doc.original_name}
                      </div>
                      <div className="text-xs text-slate-500">
                        {doc.category
                          ? t(`document.category.${doc.category}`)
                          : t("document.category.other")}
                      </div>
                      {doc.download_url && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={doc.download_url}>{t("document.download")}</a>
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="hearings">
          <Card>
            <CardHeader>
              <CardTitle>{t("case.detail.tabs.hearings")}</CardTitle>
              <CardDescription>{t("dashboard.section.hearings_desc")}</CardDescription>
            </CardHeader>
            <CardContent>
              {hearings.length === 0 ? (
                <EmptyState
                  title={t("case.detail.hearings_empty_title")}
                  description={t("case.detail.hearings_empty_desc")}
                />
              ) : (
            <Table className="min-w-[720px]">
              <TableHeader>
                <TableRow>
                  <TableHead>{t("table.date")}</TableHead>
                  <TableHead>{t("table.type")}</TableHead>
                  <TableHead>{t("hearing.agenda")}</TableHead>
                  <TableHead>{t("table.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {hearings.map((hearing) => (
                      <TableRow key={hearing.public_id}>
                        <TableCell>
                          {hearing.hearing_at
                            ? format(new Date(hearing.hearing_at), "PPpp")
                            : t("common.tbd")}
                        </TableCell>
                        <TableCell>
                          {hearing.type
                            ? t(`hearing.type.${hearing.type}`)
                            : t("hearing.type.hearing")}
                        </TableCell>
                        <TableCell>{hearing.agenda ?? "-"}</TableCell>
                        <TableCell>
                          <Sheet>
                            <SheetTrigger asChild>
                              <Button variant="outline" size="sm">
                                {t("common.view")}
                              </Button>
                            </SheetTrigger>
                            <SheetContent className="w-[420px]">
                              <div className="space-y-4">
                                <div>
                                  <h2 className="text-lg font-semibold">
                                    {t("hearing.detail_title")}
                                  </h2>
                                  <p className="text-sm text-slate-600">
                                    {hearing.hearing_at
                                      ? format(
                                          new Date(hearing.hearing_at),
                                          "PPpp"
                                        )
                                      : t("common.tbd")}
                                  </p>
                                </div>
                                <div className="space-y-2 text-sm text-slate-600">
                                  <div>
                                    <span className="font-medium text-slate-900">
                                      {t("hearing.agenda")}:
                                    </span>{" "}
                                    {hearing.agenda ?? "-"}
                                  </div>
                                  <div>
                                    <span className="font-medium text-slate-900">
                                      {t("hearing.outcome")}:
                                    </span>{" "}
                                    {hearing.outcome ?? "-"}
                                  </div>
                                  <div>
                                    <span className="font-medium text-slate-900">
                                      {t("hearing.minutes")}:
                                    </span>{" "}
                                    {hearing.minutes ?? "-"}
                                  </div>
                                  <div>
                                    <span className="font-medium text-slate-900">
                                      {t("hearing.next_steps")}:
                                    </span>{" "}
                                    {hearing.next_steps ?? "-"}
                                  </div>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                                  {t("hearing.generate_note")}
                                </div>
                                <Button variant="outline" disabled>
                                  {t("hearing.generate_summary")}
                                </Button>
                              </div>
                            </SheetContent>
                          </Sheet>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="diary">
          <Card>
            <CardHeader>
              <CardTitle>{t("case.detail.tabs.diary")}</CardTitle>
              <CardDescription>{t("dashboard.section.diary_desc")}</CardDescription>
            </CardHeader>
            <CardContent>
              {diaryEntries.length === 0 ? (
                <EmptyState
                  title={t("case.detail.diary_empty_title_short")}
                  description={t("case.detail.diary_empty_desc")}
                />
              ) : (
                <Table className="min-w-[560px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("table.date")}</TableHead>
                      <TableHead>{t("table.title")}</TableHead>
                      <TableHead>{t("table.notes")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {diaryEntries.map((entry) => (
                      <TableRow key={entry.public_id}>
                        <TableCell>
                          {entry.entry_at
                            ? format(new Date(entry.entry_at), "PP")
                            : t("common.tbd")}
                        </TableCell>
                        <TableCell>{entry.title ?? t("common.entry")}</TableCell>
                        <TableCell>{entry.body ?? "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>{t("case.detail.tabs.documents")}</CardTitle>
              <CardDescription>{t("dashboard.section.documents_desc")}</CardDescription>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <EmptyState
                  title={t("case.detail.documents_empty_title")}
                  description={t("case.detail.documents_empty_desc_short")}
                />
              ) : (
                <Table className="min-w-[560px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("table.document")}</TableHead>
                      <TableHead>{t("table.category")}</TableHead>
                      <TableHead>{t("document.download")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.map((doc) => (
                      <TableRow key={doc.public_id}>
                        <TableCell>{doc.original_name}</TableCell>
                        <TableCell>
                          {doc.category
                            ? t(`document.category.${doc.category}`)
                            : t("document.category.other")}
                        </TableCell>
                        <TableCell>
                          {doc.download_url ? (
                            <Button variant="outline" size="sm" asChild>
                              <a href={doc.download_url}>{t("document.download")}</a>
                            </Button>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="participants">
          <Card>
            <CardHeader>
              <CardTitle>{t("case.detail.tabs.participants")}</CardTitle>
              <CardDescription>{t("cases.sections.team")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {canManageParticipants && (
                <div className="grid gap-3 md:grid-cols-[2fr_1fr_auto]">
                  <div className="relative">
                    <Input
                      placeholder={t("case.detail.participant_id")}
                      value={participantQuery}
                      onChange={(event) => {
                        const value = event.target.value;
                        setParticipantQuery(value);
                        setParticipantForm((prev) => ({
                          ...prev,
                          user_public_id: "",
                        }));
                      }}
                      aria-invalid={participantError}
                    />
                    {participantError && (
                      <p className="mt-1 text-xs text-rose-600">
                        {t("common.required")}
                      </p>
                    )}
                    {filteredParticipantOptions.length > 0 && (
                      <div className="absolute z-10 mt-2 max-h-64 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-sm">
                        {filteredParticipantOptions.map((member) => (
                          <button
                            key={member.public_id}
                            type="button"
                            className="flex w-full flex-col px-3 py-2 text-left text-sm hover:bg-slate-50"
                            onClick={() => {
                              setParticipantForm((prev) => ({
                                ...prev,
                                user_public_id: member.public_id,
                              }));
                              setParticipantQuery(
                                member.email
                                  ? `${member.name} (${member.email})`
                                  : member.name
                              );
                            }}
                          >
                            <span className="text-slate-900">{member.name}</span>
                            {member.email && (
                              <span className="text-xs text-slate-500">
                                {member.email}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <select
                    className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900"
                    value={participantForm.role}
                    onChange={(event) =>
                      setParticipantForm((prev) => ({
                        ...prev,
                        role: event.target.value,
                      }))
                    }
                  >
                    <option value="lead_lawyer">{t("roles.lead_lawyer")}</option>
                    <option value="lawyer">{t("roles.lawyer")}</option>
                    <option value="associate">{t("roles.associate")}</option>
                    <option value="assistant">{t("roles.assistant")}</option>
                    <option value="viewer">{t("roles.viewer")}</option>
                  </select>
                  <Button
                    onClick={() =>
                      {
                        setParticipantSubmitted(true);
                        if (!participantForm.user_public_id) {
                          return;
                        }
                        addParticipant.mutate(
                          {
                            casePublicId: casePublicId,
                            user_public_id: participantForm.user_public_id,
                            role: participantForm.role,
                          },
                          {
                            onSuccess: () => {
                              setParticipantForm((prev) => ({
                                ...prev,
                                user_public_id: "",
                              }));
                              setParticipantQuery("");
                              setParticipantSubmitted(false);
                            },
                          }
                        );
                      }
                    }
                    disabled={
                      addParticipant.isPending || !participantForm.user_public_id
                    }
                  >
                    {addParticipant.isPending ? t("common.adding") : t("common.add")}
                  </Button>
                </div>
              )}
              {participants.length === 0 ? (
                <EmptyState
                  title={t("case.detail.participants_empty_title")}
                  description={t("case.detail.participants_empty_desc")}
                />
              ) : (
                <Table className="min-w-[520px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("table.name")}</TableHead>
                      <TableHead>{t("table.role")}</TableHead>
                      <TableHead>{t("table.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {participants.map((participant) => (
                      <TableRow key={participant.id}>
                        <TableCell>
                          {participant.user?.name ?? t("common.user")}
                        </TableCell>
                        <TableCell className="capitalize">
                          {participant.role ? t(`roles.${participant.role}`) : "-"}
                        </TableCell>
                        <TableCell>
                          {canManageParticipants && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                removeParticipant.mutate({
                                  casePublicId,
                                  participantId: participant.id,
                                })
                              }
                              disabled={removeParticipant.isPending}
                            >
                              {t("common.remove")}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="parties">
          <Card>
            <CardHeader>
              <CardTitle>{t("case.detail.parties")}</CardTitle>
              <CardDescription>{t("cases.sections.parties")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {canManageParticipants && (
                <div className="grid gap-3 rounded-2xl border border-slate-200 p-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1">
                      <Input
                        placeholder={t("cases.parties.name")}
                        value={partyForm.name}
                        onChange={(event) =>
                          setPartyForm((prev) => ({
                            ...prev,
                            name: event.target.value,
                          }))
                        }
                        aria-invalid={partyNameError}
                      />
                      {partyNameError && (
                        <p className="text-xs text-rose-600">
                          {t("common.required")}
                        </p>
                      )}
                    </div>
                    <select
                      className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900"
                      value={partyForm.type}
                      onChange={(event) =>
                        setPartyForm((prev) => ({
                          ...prev,
                          type: event.target.value as PartyType,
                        }))
                      }
                    >
                      {partyTypes.map((type) => (
                        <option key={type} value={type}>
                          {t(`party.type.${type}`)}
                        </option>
                      ))}
                    </select>
                    <select
                      className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900"
                      value={partyForm.side}
                      onChange={(event) =>
                        setPartyForm((prev) => ({
                          ...prev,
                          side: event.target.value as PartySide,
                        }))
                      }
                    >
                      {partySides.map((side) => (
                        <option key={side} value={side}>
                          {t(`party.side.${side}`)}
                        </option>
                      ))}
                    </select>
                    <select
                      className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900"
                      value={partyForm.role}
                      onChange={(event) =>
                        setPartyForm((prev) => ({
                          ...prev,
                          role: event.target.value as PartyRole,
                        }))
                      }
                    >
                      {partyRoles.map((role) => (
                        <option key={role} value={role}>
                          {t(`party.role.${role}`)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Input
                      placeholder={t("cases.parties.phone")}
                      value={partyForm.phone}
                      onChange={(event) =>
                        setPartyForm((prev) => ({
                          ...prev,
                          phone: event.target.value,
                        }))
                      }
                    />
                    <Input
                      placeholder={t("cases.parties.email")}
                      value={partyForm.email}
                      onChange={(event) =>
                        setPartyForm((prev) => ({
                          ...prev,
                          email: event.target.value,
                        }))
                      }
                    />
                    <Input
                      placeholder={t("cases.parties.address")}
                      value={partyForm.address}
                      onChange={(event) =>
                        setPartyForm((prev) => ({
                          ...prev,
                          address: event.target.value,
                        }))
                      }
                    />
                    <Input
                      placeholder={t("cases.parties.identity")}
                      value={partyForm.identity_number}
                      onChange={(event) =>
                        setPartyForm((prev) => ({
                          ...prev,
                          identity_number: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <Input
                    placeholder={t("cases.parties.notes")}
                    value={partyForm.notes}
                    onChange={(event) =>
                      setPartyForm((prev) => ({
                        ...prev,
                        notes: event.target.value,
                      }))
                    }
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => {
                        setPartySubmitted(true);
                        if (!partyForm.name.trim()) {
                          return;
                        }
                        addParty.mutate(
                          {
                            casePublicId: casePublicId,
                            name: partyForm.name,
                            type: partyForm.type,
                            side: partyForm.side,
                            role: partyForm.role,
                            phone: partyForm.phone,
                            email: partyForm.email,
                            address: partyForm.address,
                            identity_number: partyForm.identity_number,
                            notes: partyForm.notes,
                          },
                          {
                            onSuccess: () => {
                              setPartySubmitted(false);
                            },
                          }
                        );
                      }}
                      disabled={addParty.isPending}
                    >
                      {addParty.isPending
                        ? t("common.adding")
                        : t("cases.parties.add")}
                    </Button>
                  </div>
                </div>
              )}
              {parties.length === 0 ? (
                <EmptyState
                  title={t("case.detail.parties.empty")}
                  description={t("case.detail.parties.empty_desc")}
                />
              ) : (
                <Table className="min-w-[720px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("table.name")}</TableHead>
                      <TableHead>{t("table.side")}</TableHead>
                      <TableHead>{t("table.role")}</TableHead>
                      <TableHead>{t("table.contact")}</TableHead>
                      <TableHead>{t("table.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parties.map((party) => (
                      <TableRow key={String(party.id)}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm font-medium text-slate-900">
                              {party.name}
                            </div>
                            {Boolean(party.is_client) && (
                              <Badge variant="subtle">
                                {t("case.detail.parties.client_badge")}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="capitalize">
                          {party.side
                            ? t(`party.side.${party.side}` as string)
                            : "-"}
                        </TableCell>
                        <TableCell className="capitalize">
                          {party.role
                            ? t(`party.role.${party.role}` as string)
                            : "-"}
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">
                          {party.phone ?? party.email ?? "-"}
                        </TableCell>
                        <TableCell>
                          {canManageParticipants && !Boolean(party.is_client) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                removeParty.mutate({
                                  casePublicId,
                                  partyId: Number(party.id),
                                })
                              }
                              disabled={removeParty.isPending}
                            >
                              {t("common.remove")}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="text-xs text-slate-500">
        <Link href="/cases">{t("case.detail.return_cases")}</Link>
      </div>
    </section>
  );
}
