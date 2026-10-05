import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { canManageProgramme } from "@/server/auth/rbac";
import { ensureTodayPlan, proposeNextDayPriorities } from "@/server/programme/daily-plan";
import { DailyPlanEditor } from "@/components/daily-plan-editor";

export default async function DailyPlanPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  if (!canManageProgramme(user)) redirect("/founder");

  const plan = await ensureTodayPlan(user);
  const proposals = await proposeNextDayPriorities(user);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--brand-dark)]">
          Daily plan (4h)
        </h1>
        <p className="mt-1 text-[var(--muted)]">
          Structure 20/100/60/40/20. End-of-day capture proposes next-day priorities — you confirm; nothing auto-mutates.
        </p>
      </header>
      <DailyPlanEditor plan={plan} proposals={proposals.proposals} />
    </div>
  );
}
