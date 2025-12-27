
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
import { useAuth } from "@/features/auth/use-auth";
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

const statusOptions = ["open", "active", "closed", "archived"];
const hearingTypes = ["mention", "hearing", "trial", "order"];
const documentCategories = [
  "petition",
  "evidence",
  "order_sheet",
  "client_id",
  "notes",
  "other",
];
const partyTypes = ["person", "organization"];
const partySides = ["client", "opponent", "third_party"];
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
];

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

  const [diaryForm, setDiaryForm] = useState({
    entry_at: "",
    title: "",
    body: "",
    hearing_public_id: "",
  });

  const [documentForm, setDocumentForm] = useState<{
    category: string;
    file: File | null;
    hearing_public_id: string;
  }>({
    category: "petition",
    file: null,
    hearing_public_id: "",
  });

  const [participantForm, setParticipantForm] = useState({
    user_public_id: "",
    role: "assistant",
  });

  const [partyForm, setPartyForm] = useState({
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

  if (isLoading) {
    return <div className="text-sm text-slate-600">{t("common.loading")}</div>;
  }

  if (isError || !caseDetail) {
    return (
      <div className="text-sm text-rose-600">{t("common.error_loading")}</div>
    );
  }

  const nextHearing = caseDetail.upcoming_hearings?.[0];

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
            {t("case.detail.workspace")}
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">
            {caseDetail.title}
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
            <span>{caseDetail.court ?? t("cases.list.court_pending")}</span>
            <span>|</span>
            <span>{caseDetail.case_number ?? t("cases.list.case_number_pending")}</span>
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
                  />
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
                    onClick={() =>
                      createHearing.mutate({
                        case_public_id: casePublicId,
                        hearing_at: hearingForm.hearing_at,
                        type: hearingForm.type,
                        agenda: hearingForm.agenda,
                        location: hearingForm.location,
                        outcome: hearingForm.outcome,
                        minutes: hearingForm.minutes,
                        next_steps: hearingForm.next_steps,
                      })
                    }
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
                  />
                  <Input
                    placeholder={t("diary.entry_title")}
                    value={diaryForm.title}
                    onChange={(event) =>
                      setDiaryForm((prev) => ({
                        ...prev,
                        title: event.target.value,
                      }))
                    }
                  />
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
                    className="h-28 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                    placeholder={t("diary.body")}
                    value={diaryForm.body}
                    onChange={(event) =>
                      setDiaryForm((prev) => ({
                        ...prev,
                        body: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() =>
                      createDiary.mutate({
                        case_public_id: casePublicId,
                        entry_at: diaryForm.entry_at,
                        title: diaryForm.title,
                        body: diaryForm.body,
                        hearing_public_id:
                          diaryForm.hearing_public_id || undefined,
                      })
                    }
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
                      }))
                    }
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() =>
                      documentForm.file &&
                      createDocument.mutate({
                        case_public_id: casePublicId,
                        category: documentForm.category,
                        file: documentForm.file,
                        hearing_public_id:
                          documentForm.hearing_public_id || undefined,
                      })
                    }
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

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">{t("case.detail.tabs.overview")}</TabsTrigger>
          <TabsTrigger value="hearings">{t("case.detail.tabs.hearings")}</TabsTrigger>
          <TabsTrigger value="diary">{t("case.detail.tabs.diary")}</TabsTrigger>
          <TabsTrigger value="documents">{t("case.detail.tabs.documents")}</TabsTrigger>
          <TabsTrigger value="participants">{t("case.detail.tabs.participants")}</TabsTrigger>
          <TabsTrigger value="parties">{t("case.detail.tabs.parties")}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>{t("case.detail.client")}</CardTitle>
                <CardDescription>{t("cases.sections.client")}</CardDescription>
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

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t("case.detail.recent_diary")}</CardTitle>
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
                <CardTitle>{t("case.detail.recent_documents")}</CardTitle>
                <CardDescription>
                  {t("dashboard.section.documents_desc")}
                </CardDescription>
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
                <Table>
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
                <Table>
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
                <Table>
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
                  <Input
                    placeholder={t("case.detail.participant_id")}
                    value={participantForm.user_public_id}
                    onChange={(event) =>
                      setParticipantForm((prev) => ({
                        ...prev,
                        user_public_id: event.target.value,
                      }))
                    }
                  />
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
                      addParticipant.mutate({
                        casePublicId: casePublicId,
                        user_public_id: participantForm.user_public_id,
                        role: participantForm.role,
                      })
                    }
                    disabled={addParticipant.isPending}
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
                <Table>
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
                    <Input
                      placeholder={t("cases.parties.name")}
                      value={partyForm.name}
                      onChange={(event) =>
                        setPartyForm((prev) => ({
                          ...prev,
                          name: event.target.value,
                        }))
                      }
                    />
                    <select
                      className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900"
                      value={partyForm.type}
                      onChange={(event) =>
                        setPartyForm((prev) => ({
                          ...prev,
                          type: event.target.value,
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
                          side: event.target.value,
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
                          role: event.target.value,
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
                      onClick={() =>
                        addParty.mutate({
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
                        })
                      }
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
                <Table>
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
                      <TableRow key={party.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm font-medium text-slate-900">
                              {party.name}
                            </div>
                            {party.is_client && (
                              <Badge variant="subtle">
                                {t("case.detail.parties.client_badge")}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="capitalize">
                          {party.side ? t(`party.side.${party.side}`) : "-"}
                        </TableCell>
                        <TableCell className="capitalize">
                          {party.role ? t(`party.role.${party.role}`) : "-"}
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">
                          {party.phone ?? party.email ?? "-"}
                        </TableCell>
                        <TableCell>
                          {canManageParticipants && !party.is_client && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                removeParty.mutate({
                                  casePublicId,
                                  partyId: party.id,
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


