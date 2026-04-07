import type { Metadata } from "next";
import TermsPageClient from "./TermsPageClient";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "CaseDex terms of service. Governed by the laws of Bangladesh with jurisdiction in Dhaka courts.",
};

export default function TermsPage() {
  return <TermsPageClient />;
}
