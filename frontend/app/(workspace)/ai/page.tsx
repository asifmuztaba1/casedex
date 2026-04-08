"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import AiResultPanel from "@/components/ai-result-panel";
import {
  useAiPetitionDraft,
  useAiLegalSections,
  useAiCaseLaw,
  useAiNextSteps,
  useAiClientComms,
  useAiHearingSummary,
  useAiDiarySummary,
  useAiResearchSummary,
  useAiDocumentQa,
  type AiRequest,
} from "@/features/ai/use-ai";
import { useLocale } from "@/components/locale-provider";
import {
  FileSignature,
  Scale,
  BookOpen,
  ArrowRight,
  MessageSquare,
  Sparkles,
  FileText,
  NotebookPen,
  Search,
  HelpCircle,
} from "lucide-react";

type FeatureKey =
  | "petition"
  | "sections"
  | "caselaw"
  | "nextsteps"
  | "clientcomms"
  | "hearing"
  | "diary"
  | "research"
  | "docqa";

const FEATURES: {
  key: FeatureKey;
  icon: typeof FileSignature;
  color: string;
  credits: number;
}[] = [
  { key: "petition", icon: FileSignature, color: "text-indigo-600", credits: 8 },
  { key: "sections", icon: Scale, color: "text-teal-600", credits: 3 },
  { key: "caselaw", icon: BookOpen, color: "text-amber-600", credits: 5 },
  { key: "nextsteps", icon: ArrowRight, color: "text-emerald-600", credits: 4 },
  { key: "clientcomms", icon: MessageSquare, color: "text-rose-600", credits: 3 },
  { key: "hearing", icon: FileText, color: "text-blue-600", credits: 4 },
  { key: "diary", icon: NotebookPen, color: "text-purple-600", credits: 3 },
  { key: "research", icon: Search, color: "text-orange-600", credits: 5 },
  { key: "docqa", icon: HelpCircle, color: "text-cyan-600", credits: 2 },
];

export default function AiHubPage() {
  const { t } = useLocale();
  const [active, setActive] = useState<FeatureKey | null>(null);

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-indigo-500" />
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted-soft)]">
            {t("ai.hub.kicker")}
          </p>
        </div>
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">
          {t("ai.hub.title")}
        </h1>
        <p className="text-sm text-[var(--muted)]">{t("ai.hub.subtitle")}</p>
      </div>

      {!active ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <button
              key={f.key}
              onClick={() => setActive(f.key)}
              className="group text-left"
            >
              <Card className="h-full transition-all hover:border-[var(--foreground)] hover:shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <f.icon className={`h-6 w-6 ${f.color}`} />
                    <Badge className="bg-[var(--wash)] text-[var(--muted-soft)] text-[10px]">
                      {f.credits} {t("ai.credits")}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <h3 className="text-sm font-semibold text-[var(--foreground)] group-hover:underline">
                    {t(`ai.feature.${f.key}.title`)}
                  </h3>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {t(`ai.feature.${f.key}.desc`)}
                  </p>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      ) : (
        <div>
          <button
            onClick={() => setActive(null)}
            className="mb-4 text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
          >
            ← {t("ai.back_to_hub")}
          </button>
          <FeatureForm feature={active} />
        </div>
      )}
    </section>
  );
}

function FeatureForm({ feature }: { feature: FeatureKey }) {
  switch (feature) {
    case "petition":
      return <PetitionDraftForm />;
    case "sections":
      return <LegalSectionsForm />;
    case "caselaw":
      return <CaseLawForm />;
    case "nextsteps":
      return <NextStepsForm />;
    case "clientcomms":
      return <ClientCommsForm />;
    case "hearing":
      return <SummaryForm type="hearing" />;
    case "diary":
      return <SummaryForm type="diary" />;
    case "research":
      return <SummaryForm type="research" />;
    case "docqa":
      return <DocQaForm />;
  }
}

// ─── Petition Draft ──────────────────────────────────────────

function PetitionDraftForm() {
  const { t } = useLocale();
  const mutation = useAiPetitionDraft();
  const [form, setForm] = useState({
    case_type: "",
    court_name: "",
    client_name: "",
    opponent_name: "",
    facts: "",
    relief_sought: "",
    sections: "",
    language: "mixed" as "en" | "bn" | "mixed",
  });

  const set = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const submit = () => {
    if (!form.case_type || !form.facts) return;
    mutation.mutate(form);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileSignature className="h-5 w-5 text-indigo-600" />
          {t("ai.feature.petition.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--muted)]">{t("ai.petition.case_type")}</label>
            <Input placeholder={t("ai.petition.case_type_ph")} value={form.case_type} onChange={(e) => set("case_type", e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--muted)]">{t("ai.petition.court")}</label>
            <Input placeholder={t("ai.petition.court_ph")} value={form.court_name} onChange={(e) => set("court_name", e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--muted)]">{t("ai.petition.client")}</label>
            <Input placeholder={t("ai.petition.client_ph")} value={form.client_name} onChange={(e) => set("client_name", e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--muted)]">{t("ai.petition.opponent")}</label>
            <Input placeholder={t("ai.petition.opponent_ph")} value={form.opponent_name} onChange={(e) => set("opponent_name", e.target.value)} />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--muted)]">{t("ai.petition.facts")}</label>
          <Textarea rows={5} placeholder={t("ai.petition.facts_ph")} value={form.facts} onChange={(e) => set("facts", e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--muted)]">{t("ai.petition.relief")}</label>
          <Textarea rows={2} placeholder={t("ai.petition.relief_ph")} value={form.relief_sought} onChange={(e) => set("relief_sought", e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--muted)]">{t("ai.petition.sections")}</label>
          <Input placeholder={t("ai.petition.sections_ph")} value={form.sections} onChange={(e) => set("sections", e.target.value)} />
        </div>
        <LanguageSelect value={form.language} onChange={(v) => set("language", v)} />
        <Button onClick={submit} disabled={mutation.isPending || !form.case_type || !form.facts}>
          <Sparkles className="mr-2 h-4 w-4" /> {t("ai.generate")}
        </Button>
        <AiResultPanel request={mutation.data ?? null} isPending={mutation.isPending} />
      </CardContent>
    </Card>
  );
}

// ─── Legal Section Lookup ────────────────────────────────────

function LegalSectionsForm() {
  const { t } = useLocale();
  const mutation = useAiLegalSections();
  const [content, setContent] = useState("");
  const [language, setLanguage] = useState<"en" | "bn" | "mixed">("mixed");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Scale className="h-5 w-5 text-teal-600" />
          {t("ai.feature.sections.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--muted)]">{t("ai.sections.situation")}</label>
          <Textarea rows={5} placeholder={t("ai.sections.situation_ph")} value={content} onChange={(e) => setContent(e.target.value)} />
        </div>
        <LanguageSelect value={language} onChange={setLanguage} />
        <Button onClick={() => mutation.mutate({ content, language })} disabled={mutation.isPending || !content}>
          <Sparkles className="mr-2 h-4 w-4" /> {t("ai.find_sections")}
        </Button>
        <AiResultPanel request={mutation.data ?? null} isPending={mutation.isPending} />
      </CardContent>
    </Card>
  );
}

// ─── Case Law Suggestion ─────────────────────────────────────

function CaseLawForm() {
  const { t } = useLocale();
  const mutation = useAiCaseLaw();
  const [content, setContent] = useState("");
  const [language, setLanguage] = useState<"en" | "bn" | "mixed">("mixed");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <BookOpen className="h-5 w-5 text-amber-600" />
          {t("ai.feature.caselaw.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--muted)]">{t("ai.caselaw.issue")}</label>
          <Textarea rows={5} placeholder={t("ai.caselaw.issue_ph")} value={content} onChange={(e) => setContent(e.target.value)} />
        </div>
        <LanguageSelect value={language} onChange={setLanguage} />
        <Button onClick={() => mutation.mutate({ content, language })} disabled={mutation.isPending || !content}>
          <Sparkles className="mr-2 h-4 w-4" /> {t("ai.find_caselaw")}
        </Button>
        <AiResultPanel request={mutation.data ?? null} isPending={mutation.isPending} />
      </CardContent>
    </Card>
  );
}

// ─── Next Steps ──────────────────────────────────────────────

function NextStepsForm() {
  const { t } = useLocale();
  const mutation = useAiNextSteps();
  const [form, setForm] = useState({ case_title: "", case_status: "", content: "", language: "mixed" as "en" | "bn" | "mixed" });
  const set = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ArrowRight className="h-5 w-5 text-emerald-600" />
          {t("ai.feature.nextsteps.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--muted)]">{t("ai.nextsteps.case_title")}</label>
            <Input placeholder={t("ai.nextsteps.case_title_ph")} value={form.case_title} onChange={(e) => set("case_title", e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--muted)]">{t("ai.nextsteps.status")}</label>
            <Input placeholder={t("ai.nextsteps.status_ph")} value={form.case_status} onChange={(e) => set("case_status", e.target.value)} />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--muted)]">{t("ai.nextsteps.details")}</label>
          <Textarea rows={5} placeholder={t("ai.nextsteps.details_ph")} value={form.content} onChange={(e) => set("content", e.target.value)} />
        </div>
        <LanguageSelect value={form.language} onChange={(v) => set("language", v)} />
        <Button onClick={() => mutation.mutate(form)} disabled={mutation.isPending || !form.content}>
          <Sparkles className="mr-2 h-4 w-4" /> {t("ai.suggest_steps")}
        </Button>
        <AiResultPanel request={mutation.data ?? null} isPending={mutation.isPending} />
      </CardContent>
    </Card>
  );
}

// ─── Client Communication ────────────────────────────────────

function ClientCommsForm() {
  const { t } = useLocale();
  const mutation = useAiClientComms();
  const [form, setForm] = useState({ case_title: "", client_name: "", content: "", tone: "simple" as "formal" | "simple", language: "bn" as "en" | "bn" | "mixed" });
  const set = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquare className="h-5 w-5 text-rose-600" />
          {t("ai.feature.clientcomms.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--muted)]">{t("ai.comms.client_name")}</label>
            <Input placeholder={t("ai.comms.client_name_ph")} value={form.client_name} onChange={(e) => set("client_name", e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--muted)]">{t("ai.comms.case_title")}</label>
            <Input placeholder={t("ai.comms.case_title_ph")} value={form.case_title} onChange={(e) => set("case_title", e.target.value)} />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--muted)]">{t("ai.comms.update")}</label>
          <Textarea rows={4} placeholder={t("ai.comms.update_ph")} value={form.content} onChange={(e) => set("content", e.target.value)} />
        </div>
        <div className="flex gap-2">
          <label className="text-xs font-medium text-[var(--muted)] self-center mr-2">{t("ai.comms.tone")}</label>
          {(["simple", "formal"] as const).map((tone) => (
            <Button key={tone} variant={form.tone === tone ? "default" : "outline"} size="sm" onClick={() => set("tone", tone)}>
              {t(`ai.comms.tone_${tone}`)}
            </Button>
          ))}
        </div>
        <LanguageSelect value={form.language} onChange={(v) => set("language", v)} />
        <Button onClick={() => mutation.mutate(form)} disabled={mutation.isPending || !form.content}>
          <Sparkles className="mr-2 h-4 w-4" /> {t("ai.draft_message")}
        </Button>
        <AiResultPanel request={mutation.data ?? null} isPending={mutation.isPending} />
      </CardContent>
    </Card>
  );
}

// ─── Summarize (Hearing / Diary / Research) ──────────────────

function SummaryForm({ type }: { type: "hearing" | "diary" | "research" }) {
  const { t } = useLocale();
  const hearingMut = useAiHearingSummary();
  const diaryMut = useAiDiarySummary();
  const researchMut = useAiResearchSummary();
  const mutation = type === "hearing" ? hearingMut : type === "diary" ? diaryMut : researchMut;
  const [content, setContent] = useState("");

  const icons = { hearing: FileText, diary: NotebookPen, research: Search };
  const colors = { hearing: "text-blue-600", diary: "text-purple-600", research: "text-orange-600" };
  const Icon = icons[type];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon className={`h-5 w-5 ${colors[type]}`} />
          {t(`ai.feature.${type}.title`)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--muted)]">{t(`ai.summary.content`)}</label>
          <Textarea rows={6} placeholder={t(`ai.summary.content_ph`)} value={content} onChange={(e) => setContent(e.target.value)} />
        </div>
        <Button onClick={() => mutation.mutate({ content })} disabled={mutation.isPending || !content}>
          <Sparkles className="mr-2 h-4 w-4" /> {t("ai.summarize")}
        </Button>
        <AiResultPanel request={mutation.data ?? null} isPending={mutation.isPending} />
      </CardContent>
    </Card>
  );
}

// ─── Document Q&A ────────────────────────────────────────────

function DocQaForm() {
  const { t } = useLocale();
  const mutation = useAiDocumentQa();
  const [question, setQuestion] = useState("");
  const [context, setContext] = useState("");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <HelpCircle className="h-5 w-5 text-cyan-600" />
          {t("ai.feature.docqa.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--muted)]">{t("ai.docqa.context")}</label>
          <Textarea rows={5} placeholder={t("ai.docqa.context_ph")} value={context} onChange={(e) => setContext(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--muted)]">{t("ai.docqa.question")}</label>
          <Input placeholder={t("ai.docqa.question_ph")} value={question} onChange={(e) => setQuestion(e.target.value)} />
        </div>
        <Button onClick={() => mutation.mutate({ question, context })} disabled={mutation.isPending || !question || !context}>
          <Sparkles className="mr-2 h-4 w-4" /> {t("ai.ask")}
        </Button>
        <AiResultPanel request={mutation.data ?? null} isPending={mutation.isPending} />
      </CardContent>
    </Card>
  );
}

// ─── Language Picker ─────────────────────────────────────────

function LanguageSelect({ value, onChange }: { value: string; onChange: (v: "en" | "bn" | "mixed") => void }) {
  const { t } = useLocale();
  return (
    <div className="flex items-center gap-2">
      <label className="text-xs font-medium text-[var(--muted)]">{t("ai.language")}</label>
      {(["en", "bn", "mixed"] as const).map((lang) => (
        <Button key={lang} variant={value === lang ? "default" : "outline"} size="sm" onClick={() => onChange(lang)}>
          {t(`ai.lang_${lang}`)}
        </Button>
      ))}
    </div>
  );
}
