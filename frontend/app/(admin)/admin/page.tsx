"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAdminAnalytics } from "@/features/admin/use-admin-platform";
import { useLocale } from "@/components/locale-provider";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminDashboardPage() {
  const { t } = useLocale();
  const { data, isLoading } = useAdminAnalytics();

  const planColors: Record<string, string> = {
    trial: "bg-amber-100 text-amber-800",
    starter: "bg-[var(--wash)] text-[var(--muted)]",
    professional: "bg-indigo-100 text-indigo-800",
    chambers: "bg-teal-100 text-teal-800",
  };

  return (
    <section className="space-y-8">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted-soft)]">
          {t("admin.dashboard.kicker")}
        </p>
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">
          {t("admin.dashboard.title")}
        </h1>
        <p className="text-sm text-[var(--muted)]">
          {t("admin.dashboard.subtitle")}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t("admin.analytics.total_tenants")} value={data?.total_tenants} loading={isLoading} />
        <StatCard label={t("admin.analytics.total_users")} value={data?.total_users} loading={isLoading} />
        <StatCard label={t("admin.analytics.total_cases")} value={data?.total_cases} loading={isLoading} />
        <StatCard label={t("admin.analytics.pending_payments")} value={data?.pending_payments} loading={isLoading} accent />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t("admin.analytics.open_tickets")} value={data?.open_tickets} loading={isLoading} accent />
        <StatCard label={t("admin.analytics.pending_jobs")} value={data?.queue?.pending_jobs} loading={isLoading} />
        <StatCard label={t("admin.analytics.failed_jobs")} value={data?.queue?.failed_jobs} loading={isLoading} accent />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Object.entries(data?.tenants_by_plan ?? {}).map(([plan, count]) => (
          <Card key={plan}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-[var(--muted)]">
                <span className={`mr-2 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${planColors[plan] ?? ""}`}>
                  {plan}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold text-[var(--foreground)]">
              {count}
            </CardContent>
          </Card>
        ))}
        {data && (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-[var(--muted)]">{t("admin.analytics.on_trial")}</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold text-emerald-600">{data.on_trial}</CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-[var(--muted)]">{t("admin.analytics.trial_expired")}</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold text-rose-600">{data.trial_expired}</CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("admin.analytics.recent_tenants")}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8" />)}</div>
            ) : (
              <div className="space-y-2">
                {data?.recent_tenants.map((tenant) => (
                  <div key={tenant.public_id} className="flex items-center justify-between rounded-lg border border-[var(--border)] px-3 py-2">
                    <div>
                      <div className="text-sm font-medium text-[var(--foreground)]">{tenant.name}</div>
                      <div className="text-xs text-[var(--muted-soft)]">
                        {tenant.users_count} users &middot; {tenant.country}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={planColors[tenant.plan ?? ""] ?? ""}>{tenant.plan ?? "—"}</Badge>
                      <div className="mt-1 text-[10px] text-[var(--muted-soft)]">
                        {new Date(tenant.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
                {data?.recent_tenants.length === 0 && (
                  <p className="py-4 text-center text-sm text-[var(--muted-soft)]">No tenants yet.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("admin.analytics.recent_users")}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8" />)}</div>
            ) : (
              <div className="space-y-2">
                {data?.recent_users.map((user) => (
                  <div key={user.public_id} className="flex items-center justify-between rounded-lg border border-[var(--border)] px-3 py-2">
                    <div>
                      <div className="text-sm font-medium text-[var(--foreground)]">{user.name}</div>
                      <div className="text-xs text-[var(--muted-soft)]">{user.email}</div>
                    </div>
                    <div className="text-right">
                      <Badge>{user.role}</Badge>
                      <div className="mt-1 text-[10px] text-[var(--muted-soft)]">
                        {user.tenant_name ?? "No firm"}
                      </div>
                    </div>
                  </div>
                ))}
                {data?.recent_users.length === 0 && (
                  <p className="py-4 text-center text-sm text-[var(--muted-soft)]">No users yet.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function StatCard({ label, value, loading, accent }: { label: string; value?: number; loading: boolean; accent?: boolean }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-[var(--muted)]">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-9 w-20" />
        ) : (
          <div className={`text-3xl font-semibold ${accent && (value ?? 0) > 0 ? "text-amber-600" : "text-[var(--foreground)]"}`}>
            {value ?? 0}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
