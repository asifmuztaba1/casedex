"use client";

import Link from "next/link";
import StatusBadge from "@/components/status-badge";
import { useLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ContactCaseHistoryItem } from "@/features/clients/use-clients";

interface ContactCaseHistoryProps {
  caseHistory: ContactCaseHistoryItem[];
}

export default function ContactCaseHistory({
  caseHistory,
}: ContactCaseHistoryProps) {
  const { t } = useLocale();

  if (caseHistory.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        {t("contact.no_cases") ?? "No case history"}
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("table.case") ?? "Case"}</TableHead>
          <TableHead>{t("table.case_number") ?? "Case Number"}</TableHead>
          <TableHead>{t("table.status") ?? "Status"}</TableHead>
          <TableHead>{t("contact.side") ?? "Side"}</TableHead>
          <TableHead>{t("contact.role") ?? "Role"}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {caseHistory.map((item) => (
          <TableRow key={item.case_public_id}>
            <TableCell>
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/cases/${item.case_public_id}`}>
                  {item.title}
                </Link>
              </Button>
            </TableCell>
            <TableCell>{item.case_number ?? "-"}</TableCell>
            <TableCell>
              <StatusBadge status={item.status} />
            </TableCell>
            <TableCell>{item.party_side ?? "-"}</TableCell>
            <TableCell>{item.party_role ?? "-"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
