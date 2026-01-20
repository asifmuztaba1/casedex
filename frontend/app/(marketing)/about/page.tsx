import type { Metadata } from "next";
import AboutPageClient from "@/app/(marketing)/about/AboutPageClient";

export const metadata: Metadata = {
  title: "About CaseDex",
  description:
    "CaseDex is a structured case workspace for legal professionals and law students.",
};

export default function AboutPage() {
  return <AboutPageClient />;
}
