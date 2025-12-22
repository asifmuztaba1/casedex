"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { format, formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  useCaseDetail,
  DocumentSummary,
} from "@/features/cases/use-cases";
import { useCaseHearings } from "@/features/hearings/use-hearings";
import { useCaseDiaryEntries } from "@/features/diary/use-diary-entries";
import { useCaseDocuments, useCreateDocument } from "@/features/documents/use-documents";
import {
  useAddCaseParticipant,
  useCaseParticipants,
  useRemoveCaseParticipant,
} from "@/features/cases/use-case-participants";

const categoryOptions = [
  "petition",
  "evidence",
  "order_sheet",
  "client_id",
  "notes",
  "other",
];

export default function CaseDetailPage() {
  const params = useParams();
  const casePublicId = params.publicId as string;
  const { data: caseDetail, isLoading } = useCaseDetail(casePublicId);
  const { data: hearingsData } = useCaseHearings(casePublicId);
  const { data: diaryData } = useCaseDiaryEntries(casePublicId);
  const { data: documentsData } = useCaseDocuments(casePublicId);
  const { data: participantsData } = useCaseParticipants(casePublicId);
  const createDocument = useCreateDocument();
  const addParticipant = useAddCaseParticipant();
  const removeParticipant = useRemoveCaseParticipant();

  const [participantUserId, setParticipantUserId] = useState("");
  const [participantRole, setParticipantRole] = useState("associate");
  const [documentCategory, setDocumentCategory] = useState(categoryOptions[0]);
  const [documentFile, setDocumentFile] = useState<File | null>(null);

  const hearings = hearingsData?.data ?? [];
  const diaryEntries = diaryData?.data ?? [];
  const documents = documentsData?.data ?? [];
  const participants = participantsData?.data ?? [];

  const nextHearing = useMemo(() => {
    if (!caseDetail?.upcoming_hearings?.length) {
      return null;
    }
    return caseDetail.upcoming_hearings[0];
  }, [caseDetail]);

  const onUploadDocument = () => {
    if (!documentFile) {
      return;
    }

    createDocument.mutate({
      case_public_id: casePublicId,
      category: documentCategory,
      file: documentFile,
    });
  };

  if (isLoading || !caseDetail) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
        Loading case details...
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <header className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-wide text-slate-500">
              Case workspace
            </p>
            <h1 className="text-2xl font-semibold text-slate-900">
              {caseDetail.title}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
              <span>{caseDetail.court ?? "Court not set"}</span>
              <span className="text-slate-300">|</span>
              <span>{caseDetail.case_number ?? "Case number pending"}</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="subtle">{caseDetail.status ?? "open"}</Badge>
            <Button variant="outline" size="sm">
              Add hearing
            </Button>
            <Button variant="outline" size="sm">
              Add diary
            </Button>
            <Button variant="outline" size="sm">
              Upload document
            </Button>
            <Button size="sm">Edit case</Button>
          </div>
        </div>
      </header>

      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="hearings">Hearings</TabsTrigger>
          <TabsTrigger value="diary">Diary</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="participants">Participants</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 pt-6">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <Card>
              <CardHeader>
                <CardTitle>Client</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-slate-600">
                <div className="text-base font-medium text-slate-900">
                  {caseDetail.client?.name ?? "Client not set"}
                </div>
                <div>{caseDetail.client?.phone ?? "Phone not provided"}</div>
                <div>{caseDetail.client?.address ?? "Address not provided"}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Next hearing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-slate-600">
                {nextHearing ? (
                  <>
                    <div className="text-base font-medium text-slate-900">
                      {nextHearing.type ?? "Hearing"}
                    </div>
                    <div>
                      {nextHearing.hearing_at
                        ? format(new Date(nextHearing.hearing_at), "PPpp")
                        : "Schedule pending"}
                    </div>
                    <div>
                      {nextHearing.hearing_at
                        ? formatDistanceToNow(new Date(nextHearing.hearing_at), {
                            addSuffix: true,
                          })
                        : ""}
                    </div>
                    <div>{nextHearing.agenda ?? "Agenda not set"}</div>
                  </>
                ) : (
                  <div>No upcoming hearings yet.</div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Petition draft</CardTitle>
            </CardHeader>
            <CardContent>
              <details className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <summary className="cursor-pointer font-medium text-slate-900">
                  View draft
                </summary>
                <div className="mt-3 whitespace-pre-wrap">
                  {caseDetail.petition_draft ?? "No draft added yet."}
                </div>
              </details>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent diary entries</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-600">
                {caseDetail.recent_diary_entries.length === 0 ? (
                  <div>No diary entries yet.</div>
                ) : (
                  caseDetail.recent_diary_entries.map((entry) => (
                    <div key={entry.public_id} className="space-y-1">
                      <div className="font-medium text-slate-900">
                        {entry.title}
                      </div>
                      <div>
                        {entry.entry_at
                          ? format(new Date(entry.entry_at), "PP")
                          : "Date pending"}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent documents</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-600">
                {caseDetail.recent_documents.length === 0 ? (
                  <div>No documents uploaded yet.</div>
                ) : (
                  caseDetail.recent_documents.map((doc) => (
                    <div key={doc.public_id} className="space-y-1">
                      <div className="font-medium text-slate-900">
                        {doc.original_name}
                      </div>
                      <div>{doc.category ?? "Other"}</div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="hearings" className="space-y-6 pt-6">
          <Card>
            <CardHeader>
              <CardTitle>Hearing schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Next steps</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hearings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4}>
                        No hearings yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    hearings.map((hearing) => (
                      <TableRow key={hearing.public_id}>
                        <TableCell>
                          {hearing.hearing_at
                            ? format(new Date(hearing.hearing_at), "PPpp")
                            : "TBD"}
                        </TableCell>
                        <TableCell>{hearing.type ?? "Hearing"}</TableCell>
                        <TableCell>{hearing.next_steps ?? "-"}</TableCell>
                        <TableCell>
                          <Sheet>
                            <SheetTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                              >
                                View
                              </Button>
                            </SheetTrigger>
                            <SheetContent>
                              <div className="space-y-4">
                                <div>
                                  <p className="text-sm uppercase tracking-wide text-slate-500">
                                    Hearing details
                                  </p>
                                  <h2 className="text-lg font-semibold text-slate-900">
                                    {hearing.type ?? "Hearing"}
                                  </h2>
                                </div>
                                <div className="text-sm text-slate-600">
                                  <div>
                                    {hearing.hearing_at
                                      ? format(
                                          new Date(hearing.hearing_at),
                                          "PPpp"
                                        )
                                      : "Date pending"}
                                  </div>
                                  <div>{hearing.location ?? "Location TBD"}</div>
                                </div>
                                <div className="space-y-2 text-sm text-slate-700">
                                  <div>
                                    <span className="font-medium">Agenda:</span>{" "}
                                    {hearing.agenda ?? "Not set"}
                                  </div>
                                  <div>
                                    <span className="font-medium">Minutes:</span>{" "}
                                    {hearing.minutes ?? "Not recorded"}
                                  </div>
                                  <div>
                                    <span className="font-medium">Outcome:</span>{" "}
                                    {hearing.outcome ?? "Pending"}
                                  </div>
                                  <div>
                                    <span className="font-medium">Next steps:</span>{" "}
                                    {hearing.next_steps ?? "None"}
                                  </div>
                                </div>
                                <Button variant="outline">
                                  Generate summary
                                </Button>
                              </div>
                            </SheetContent>
                          </Sheet>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="diary" className="space-y-6 pt-6">
          <Card>
            <CardHeader>
              <CardTitle>Diary entries</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {diaryEntries.length === 0 ? (
                <div className="text-sm text-slate-600">
                  No diary entries yet.
                </div>
              ) : (
                diaryEntries.map((entry) => (
                  <div
                    key={entry.public_id}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-3"
                  >
                    <div className="text-sm font-medium text-slate-900">
                      {entry.title}
                    </div>
                    <div className="text-xs text-slate-500">
                      {entry.entry_at
                        ? format(new Date(entry.entry_at), "PP")
                        : "Date pending"}
                    </div>
                    <div className="mt-2 text-sm text-slate-600">
                      {entry.body}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6 pt-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload document</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <select
                  className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900"
                  value={documentCategory}
                  onChange={(event) => setDocumentCategory(event.target.value)}
                >
                  {categoryOptions.map((option) => (
                    <option key={option} value={option}>
                      {option.replace("_", " ")}
                    </option>
                  ))}
                </select>
                <Input
                  type="file"
                  onChange={(event) =>
                    setDocumentFile(event.target.files?.[0] ?? null)
                  }
                />
                <Button onClick={onUploadDocument}>Upload</Button>
              </div>
              <div className="text-xs text-slate-500">
                Free plan file types: pdf, jpg, png.
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Download</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3}>
                        No documents uploaded yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    documents.map((doc: DocumentSummary) => (
                      <TableRow key={doc.public_id}>
                        <TableCell>{doc.original_name}</TableCell>
                        <TableCell>{doc.category ?? "Other"}</TableCell>
                        <TableCell>
                          {doc.download_url ? (
                            <Button variant="outline" size="sm" asChild>
                              <a href={doc.download_url}>Download</a>
                            </Button>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="participants" className="space-y-6 pt-6">
          <Card>
            <CardHeader>
              <CardTitle>Participants</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-[2fr_1fr_auto]">
                <Input
                  placeholder="User public ID"
                  value={participantUserId}
                  onChange={(event) => setParticipantUserId(event.target.value)}
                />
                <select
                  className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900"
                  value={participantRole}
                  onChange={(event) => setParticipantRole(event.target.value)}
                >
                  <option value="lead_lawyer">Lead lawyer</option>
                  <option value="lawyer">Lawyer</option>
                  <option value="associate">Associate</option>
                  <option value="assistant">Assistant</option>
                  <option value="viewer">Viewer</option>
                </select>
                <Button
                  onClick={() => {
                    if (!participantUserId) {
                      return;
                    }
                    addParticipant.mutate({
                      casePublicId: casePublicId,
                      user_public_id: participantUserId,
                      role: participantRole,
                    });
                    setParticipantUserId("");
                  }}
                >
                  Add
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {participants.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3}>
                        No participants added yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    participants.map((participant) => (
                      <TableRow key={participant.id}>
                        <TableCell>
                          {participant.user?.name ?? "Unknown"}
                        </TableCell>
                        <TableCell>{participant.role}</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              removeParticipant.mutate({
                                casePublicId: casePublicId,
                                participantId: participant.id,
                              })
                            }
                          >
                            Remove
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </section>
  );
}
