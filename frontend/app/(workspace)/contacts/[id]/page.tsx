"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useLocale } from "@/components/locale-provider";
import { useClientDetail } from "@/features/clients/use-clients";
import ContactCaseHistory from "@/components/contact-case-history";
import PageHeader from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";

export default function ContactDetailPage() {
  const { t } = useLocale();
  const params = useParams();
  const id = Number(params.id);
  const { data, isLoading, isError } = useClientDetail(id);
  const contact = data?.data;

  if (isLoading) {
    return (
      <section className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
      </section>
    );
  }

  if (isError || !contact) {
    return (
      <section className="space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/contacts">
            <ArrowLeft className="mr-1 h-4 w-4" />
            {t("common.back") ?? "Back"}
          </Link>
        </Button>
        <div className="text-sm text-rose-600">
          {t("contacts.error_detail") ?? "Failed to load contact details."}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/contacts">
          <ArrowLeft className="mr-1 h-4 w-4" />
          {t("common.back") ?? "Back"}
        </Link>
      </Button>

      <PageHeader
        title={contact.name}
        actions={
          <div className="flex items-center gap-2">
            {contact.is_client && (
              <Badge variant="subtle">
                {t("contact.client") ?? "Client"}
              </Badge>
            )}
            <Badge>
              {t(`contact.type.${contact.type}`) ?? contact.type}
            </Badge>
          </div>
        }
      />

      <Card>
        <CardContent className="pt-6">
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-[var(--muted-soft)]">
                {t("table.phone") ?? "Phone"}
              </dt>
              <dd className="mt-1 text-sm text-[var(--foreground)]">
                {contact.phone ?? "-"}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-[var(--muted-soft)]">
                {t("table.email") ?? "Email"}
              </dt>
              <dd className="mt-1 text-sm text-[var(--foreground)]">
                {contact.email ?? "-"}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-[var(--muted-soft)]">
                {t("contact.address") ?? "Address"}
              </dt>
              <dd className="mt-1 text-sm text-[var(--foreground)]">
                {contact.address ?? "-"}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-[var(--muted-soft)]">
                {t("contact.identity_number") ?? "Identity Number"}
              </dt>
              <dd className="mt-1 text-sm text-[var(--foreground)]">
                {contact.identity_number ?? "-"}
              </dd>
            </div>
            {contact.notes && (
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-[var(--muted-soft)]">
                  {t("contact.notes") ?? "Notes"}
                </dt>
                <dd className="mt-1 text-sm text-[var(--foreground)] whitespace-pre-wrap">
                  {contact.notes}
                </dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-4 text-base font-semibold text-[var(--foreground)]">
          {t("contact.case_history") ?? "Case History"}
        </h2>
        <Card>
          <CardContent className="pt-6">
            <ContactCaseHistory caseHistory={contact.case_history} />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
