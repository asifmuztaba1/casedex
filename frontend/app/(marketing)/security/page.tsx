import type { Metadata } from "next";
import SecurityPageClient from "./SecurityPageClient";

export const metadata: Metadata = {
  title: "Security & Compliance",
  description:
    "How CaseDex protects legal data with tenant isolation, encryption, audit logging, and compliance with Bangladesh ICT Act and Digital Security Act.",
};

export default function SecurityPage() {
  return <SecurityPageClient />;
}
