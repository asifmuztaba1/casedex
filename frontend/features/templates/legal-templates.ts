import type { Locale } from "@/lib/locale-constants";

export type LocalizedTemplate<T> = {
  id: string;
  label: Record<Locale, string>;
  payload: Record<Locale, T>;
};

export type DiaryTemplatePayload = {
  title: string;
  body: string;
};

export const CASE_STORY_TEMPLATES: LocalizedTemplate<string>[] = [
  {
    id: "client-intake",
    label: {
      en: "Client intake",
      bn: "ক্লায়েন্ট ইনটেক",
    },
    payload: {
      en: "Client background:\nDispute summary:\nCurrent court status:\nImmediate risk:\nDocuments collected:\nNext action:",
      bn: "ক্লায়েন্টের পটভূমি:\nবিরোধের সারসংক্ষেপ:\nবর্তমান আদালত অবস্থান:\nতাৎক্ষণিক ঝুঁকি:\nসংগৃহীত নথি:\nপরবর্তী করণীয়:",
    },
  },
  {
    id: "urgent-relief",
    label: {
      en: "Urgent relief brief",
      bn: "জরুরি রিলিফ সারসংক্ষেপ",
    },
    payload: {
      en: "Urgent issue:\nRelief needed:\nWhy immediate intervention is required:\nKey documents:\nOpponent position:\nFiling priority:",
      bn: "জরুরি সমস্যা:\nপ্রয়োজনীয় রিলিফ:\nতাৎক্ষণিক হস্তক্ষেপ কেন প্রয়োজন:\nমূল নথি:\nবিপক্ষের অবস্থান:\nফাইলিং অগ্রাধিকার:",
    },
  },
  {
    id: "property-dispute",
    label: {
      en: "Property dispute",
      bn: "সম্পত্তি বিরোধ",
    },
    payload: {
      en: "Property details:\nOwnership history:\nCurrent possession:\nMain dispute point:\nSupporting evidence:\nRequired next step:",
      bn: "সম্পত্তির বিবরণ:\nমালিকানার ইতিহাস:\nবর্তমান দখল:\nপ্রধান বিরোধের বিষয়:\nসহায়ক প্রমাণ:\nপরবর্তী প্রয়োজনীয় ধাপ:",
    },
  },
];

export const PETITION_TEMPLATES: LocalizedTemplate<string>[] = [
  {
    id: "interim-relief",
    label: {
      en: "Interim relief",
      bn: "ইন্টারিম রিলিফ",
    },
    payload: {
      en: "Facts:\nGrounds:\nUrgency:\nRelief sought:\nSupporting annexures:\nPrayer:",
      bn: "ঘটনার বিবরণ:\nআইনি ভিত্তি:\nজরুরিতা:\nপ্রার্থিত রিলিফ:\nসংযুক্ত নথি:\nপ্রার্থনা:",
    },
  },
  {
    id: "adjournment",
    label: {
      en: "Adjournment note",
      bn: "মুলতবি নোট",
    },
    payload: {
      en: "Case posture:\nReason for adjournment:\nPreparation still pending:\nProposed next date:\nCourt-facing request:",
      bn: "মামলার বর্তমান অবস্থা:\nমুলতবির কারণ:\nযে প্রস্তুতি এখনো বাকি:\nপ্রস্তাবিত পরবর্তী তারিখ:\nআদালতের কাছে আবেদন:",
    },
  },
  {
    id: "filing-outline",
    label: {
      en: "Filing outline",
      bn: "ফাইলিং আউটলাইন",
    },
    payload: {
      en: "Issue presented:\nApplicable law:\nSupporting facts:\nWeak points to address:\nDocuments to attach:\nFinal prayer:",
      bn: "উত্থাপিত বিষয়:\nপ্রযোজ্য আইন:\nসমর্থনকারী তথ্য:\nযে দুর্বল দিকগুলো ব্যাখ্যা করতে হবে:\nসংযুক্ত নথি:\nচূড়ান্ত প্রার্থনা:",
    },
  },
];

export const HEARING_AGENDA_TEMPLATES: LocalizedTemplate<string>[] = [
  {
    id: "status-hearing",
    label: {
      en: "Status hearing",
      bn: "স্ট্যাটাস শুনানি",
    },
    payload: {
      en: "Confirm current case status, pending filings, and next date request.",
      bn: "বর্তমান মামলার অবস্থা, বকেয়া ফাইলিং, এবং পরবর্তী তারিখের আবেদন নিশ্চিত করুন।",
    },
  },
  {
    id: "evidence-hearing",
    label: {
      en: "Evidence hearing",
      bn: "প্রমাণ শুনানি",
    },
    payload: {
      en: "Present exhibits, confirm witness readiness, and note objections to be raised.",
      bn: "প্রদর্শনযোগ্য নথি উপস্থাপন, সাক্ষীর প্রস্তুতি নিশ্চিত, এবং উত্থাপনযোগ্য আপত্তি নোট করুন।",
    },
  },
  {
    id: "client-update",
    label: {
      en: "Client update hearing",
      bn: "ক্লায়েন্ট আপডেট শুনানি",
    },
    payload: {
      en: "Record what the court needs next and what must be communicated to the client after the hearing.",
      bn: "আদালত কী চাইছে এবং শুনানির পরে ক্লায়েন্টকে কী জানাতে হবে তা নোট করুন।",
    },
  },
];

export const DIARY_TEMPLATES: LocalizedTemplate<DiaryTemplatePayload>[] = [
  {
    id: "client-meeting",
    label: {
      en: "Client meeting",
      bn: "ক্লায়েন্ট মিটিং",
    },
    payload: {
      en: {
        title: "Client meeting note",
        body: "Attendees:\nKey updates shared:\nQuestions from client:\nDocuments requested:\nNext follow-up date:",
      },
      bn: {
        title: "ক্লায়েন্ট মিটিং নোট",
        body: "উপস্থিত ছিলেন:\nপ্রধান আপডেট:\nক্লায়েন্টের প্রশ্ন:\nযে নথি চাওয়া হয়েছে:\nপরবর্তী ফলো-আপ তারিখ:",
      },
    },
  },
  {
    id: "court-day",
    label: {
      en: "Court day note",
      bn: "কোর্ট ডে নোট",
    },
    payload: {
      en: {
        title: "Court day summary",
        body: "Bench / court:\nMatter called at:\nOrder / direction:\nOpposing counsel position:\nNext preparation needed:",
      },
      bn: {
        title: "কোর্ট ডে সারাংশ",
        body: "বেঞ্চ / আদালত:\nমামলা ডাকা হয়:\nআদেশ / নির্দেশনা:\nবিপক্ষের অবস্থান:\nপরবর্তী প্রস্তুতি:",
      },
    },
  },
  {
    id: "internal-follow-up",
    label: {
      en: "Internal follow-up",
      bn: "ইন্টারনাল ফলো-আপ",
    },
    payload: {
      en: {
        title: "Internal follow-up",
        body: "Open task:\nOwner:\nDependency:\nTarget completion:\nRisk if delayed:",
      },
      bn: {
        title: "ইন্টারনাল ফলো-আপ",
        body: "খোলা কাজ:\nদায়িত্বপ্রাপ্ত ব্যক্তি:\nনির্ভরশীলতা:\nলক্ষ্য সমাপ্তির তারিখ:\nবিলম্ব হলে ঝুঁকি:",
      },
    },
  },
];

const DOCUMENT_NAME_TEMPLATES: Record<string, LocalizedTemplate<string>[]> = {
  petition: [
    {
      id: "petition-draft",
      label: { en: "Petition draft", bn: "পিটিশন খসড়া" },
      payload: { en: "petition-draft", bn: "পিটিশন-খসড়া" },
    },
    {
      id: "supplementary-affidavit",
      label: { en: "Supplementary affidavit", bn: "সম্পূরক হলফনামা" },
      payload: { en: "supplementary-affidavit", bn: "সম্পূরক-হলফনামা" },
    },
  ],
  evidence: [
    {
      id: "evidence-bundle",
      label: { en: "Evidence bundle", bn: "প্রমাণ বান্ডিল" },
      payload: { en: "evidence-bundle", bn: "প্রমাণ-বান্ডিল" },
    },
    {
      id: "exhibit-list",
      label: { en: "Exhibit list", bn: "এক্সহিবিট তালিকা" },
      payload: { en: "exhibit-list", bn: "এক্সহিবিট-তালিকা" },
    },
  ],
  order_sheet: [
    {
      id: "order-sheet",
      label: { en: "Order sheet", bn: "অর্ডার শীট" },
      payload: { en: "order-sheet", bn: "অর্ডার-শীট" },
    },
    {
      id: "certified-copy",
      label: { en: "Certified copy", bn: "সার্টিফায়েড কপি" },
      payload: { en: "certified-copy", bn: "সার্টিফায়েড-কপি" },
    },
  ],
  client_id: [
    {
      id: "client-nid",
      label: { en: "Client NID", bn: "ক্লায়েন্ট এনআইডি" },
      payload: { en: "client-nid", bn: "ক্লায়েন্ট-এনআইডি" },
    },
    {
      id: "authorization-letter",
      label: { en: "Authorization letter", bn: "অনুমতিপত্র" },
      payload: { en: "authorization-letter", bn: "অনুমতিপত্র" },
    },
  ],
  notes: [
    {
      id: "hearing-notes",
      label: { en: "Hearing notes", bn: "শুনানি নোট" },
      payload: { en: "hearing-notes", bn: "শুনানি-নোট" },
    },
    {
      id: "research-notes",
      label: { en: "Research notes", bn: "রিসার্চ নোট" },
      payload: { en: "research-notes", bn: "রিসার্চ-নোট" },
    },
  ],
  other: [
    {
      id: "supporting-document",
      label: { en: "Supporting document", bn: "সহায়ক নথি" },
      payload: { en: "supporting-document", bn: "সহায়ক-নথি" },
    },
    {
      id: "reference-material",
      label: { en: "Reference material", bn: "রেফারেন্স ম্যাটেরিয়াল" },
      payload: { en: "reference-material", bn: "রেফারেন্স-ম্যাটেরিয়াল" },
    },
  ],
};

export function getDocumentNameTemplates(category: string): LocalizedTemplate<string>[] {
  return DOCUMENT_NAME_TEMPLATES[category] ?? DOCUMENT_NAME_TEMPLATES.other;
}
