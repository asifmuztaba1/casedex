import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  return (
    <section className="mx-auto w-full max-w-xl space-y-8">
      <Card>
        <CardHeader className="space-y-3">
          <p className="text-sm uppercase tracking-wide text-slate-500">Log in</p>
          <CardTitle className="text-2xl font-semibold">
            Access your case workspace
          </CardTitle>
          <CardDescription>
            Sign in to review cases, hearings, diary entries, and documents.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Email
              </label>
              <Input placeholder="you@firm.com" type="email" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Password
              </label>
              <Input placeholder="********" type="password" />
            </div>
            <div className="flex flex-col gap-3">
              <Button className="w-full" type="button">
                Log in
              </Button>
              <Button className="w-full" variant="outline" type="button">
                Request access
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
