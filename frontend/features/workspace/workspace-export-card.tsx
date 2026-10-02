"use client";

import { Download } from "lucide-react";
import { useLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/date-format";
import {
  type WorkspaceExport,
  useRequestWorkspaceExport,
  useWorkspaceExports,
} from "@/features/workspace/use-workspace-exports";

function formatSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Admin settings card: email a zip of all cases, contacts and documents. */
export default function WorkspaceExportCard() {
  const { t, locale } = useLocale();
  const { data } = useWorkspaceExports(true);
  const requestExport = useRequestWorkspaceExport();
  const exports = data?.data ?? [];
  const building = exports.some((item) => item.status === "pending");

  const statusText = (item: WorkspaceExport) => {
    if (item.status === "ready" && item.expires_at) {
      return t("export.status.ready_until").replace("{date}", formatDate(item.expires_at, "PP", locale));
    }
    return t(`export.status.${item.status}`);
  };

  return (
    <Card>
      <CardHeader className="space-y-2">
        <CardTitle className="text-lg">{t("export.title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-[var(--muted)]">
        <p>{t("export.desc")}</p>
        <Button onClick={() => requestExport.mutate()} disabled={requestExport.isPending || building}>
          {building ? t("export.building") : t("export.request")}
        </Button>

        {exports.length > 0 && (
          <ul className="divide-y divide-[var(--border)] rounded-lg border border-[var(--border)]">
            {exports.map((item) => (
              <li key={item.public_id} className="flex items-center justify-between gap-3 px-3 py-2">
                <div className="min-w-0">
                  <div className="text-[var(--foreground)]">
                    {item.created_at ? formatDate(item.created_at, "PPp", locale) : "-"}
                    {item.size_bytes ? ` · ${formatSize(item.size_bytes)}` : ""}
                  </div>
                  <div className="text-xs text-[var(--muted-soft)]">{statusText(item)}</div>
                </div>
                {item.download_url && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={item.download_url}>
                      <Download className="mr-1 h-3.5 w-3.5" aria-hidden />
                      {t("export.download")}
                    </a>
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
