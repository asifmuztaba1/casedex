import type { Metadata } from "next";
import FeaturesPageClient from "./FeaturesPageClient";

export const metadata: Metadata = {
  title: "Features",
  description:
    "Case workspace, hearing timelines, document management, AI summaries, team coordination, and more. Every module mapped to the legal workflow.",
};

export default function FeaturesPage() {
  return <FeaturesPageClient />;
}
