import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <section className="space-y-8">
      <Card>
        <CardHeader className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
            Settings
          </p>
          <CardTitle className="text-2xl font-semibold">
            Workspace settings
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-600">
          Configure users, notifications, and tenant preferences.
        </CardContent>
      </Card>
    </section>
  );
}
