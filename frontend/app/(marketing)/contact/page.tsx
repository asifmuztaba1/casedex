import type { Metadata } from "next";
import ContactPageClient from "./ContactPageClient";

export const metadata: Metadata = {
  title: "Contact & Support",
  description:
    "Get in touch with the CaseDex team. Email support, security concerns, and office location in Dhaka, Bangladesh.",
};

export default function ContactPage() {
  return <ContactPageClient />;
}
