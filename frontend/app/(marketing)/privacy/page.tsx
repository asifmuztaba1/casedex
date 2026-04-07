import type { Metadata } from "next";
import PrivacyPageClient from "./PrivacyPageClient";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How CaseDex protects your data, handles third-party AI processing, and complies with Bangladesh data protection regulations.",
};

export default function PrivacyPage() {
  return <PrivacyPageClient />;
}
