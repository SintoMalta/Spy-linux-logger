import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/server/auth/session";
import { canManageProgramme } from "@/server/auth/rbac";
import { ensureTodayPlan, proposeNextDayPriorities } from "@/server/programme/daily-plan";
import { DailyPlanEditor } from "@/components/daily-plan-editor";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { plainTaskStatus } from "@/lib/plain-labels";
import { DutyWorkspaceMap } from "@/components/duty-workspace-map";

export default async function DailyPlanPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  if (!canManageProgramme(user)) redirect("/founder");

  const [plan, proposals, current] = await Promise.all([
    ensureTodayPlan(user),
    proposeNextDayPriorities(user),
    prisma.stage.findFirst({
      where: { status: "IN_PROGRESS", deletedAt: null },
      include: {
        tasks: {
          where: {
            deletedAt: null,
            status: { notIn: ["ACHIEVED", "CANCELLED"] },
          },
          orderBy: { title: "asc" },
        },
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--brand-dark)]">
          Your tasks
        </h1>
        <p className="mt-1 text-[var(--muted)]">
          This is Nesli&apos;s daily list. Tick each block as you finish it. Programme work for
          the week is also listed below — open the 12-week plan to mark those finished.
        </p>
      </header>

      <section className="rounded-xl border border-[var(--brand)]/30 bg-[var(--surface)] p-4 text-sm">
        <p className="font-medium">Quick path</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>Tick today&apos;s blocks on this page</li>
          <li>
            Do this week&apos;s programme tasks in{" "}
            <Link href="/programme" className="underline">
              12-week plan
            </Link>
          </li>
          <li>
            Add people in{" "}
            <Link href="/crm" className="underline">
              Contacts
            </Link>{" "}
            and notes in{" "}
            <Link href="/interviews" className="underline">
              Interviews
            </Link>
          </li>
          <li>
            Send work to the founder from{" "}
            <Link href="/dashboard" className="underline">
              Home
            </Link>{" "}
            or check{" "}
            <Link href="/founder" className="underline">
              Founder asks
            </Link>
          </li>
        </ol>
      </section>

      <DailyPlanEditor plan={plan} proposals={proposals.proposals} />

      <DutyWorkspaceMap />

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/80 p-4">
        <h2 className="font-[family-name:var(--font-display)] text-lg">
          {current
            ? `Also do this week (Week ${current.weekNumber}: ${current.title})`
            : "Also do this week"}
        </h2>
        <ul className="mt-3 space-y-2">
          {(current?.tasks ?? []).map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-2 text-sm">
              <span>{t.title}</span>
              <Badge>{plainTaskStatus(t.status)}</Badge>
            </li>
          ))}
          {!current?.tasks.length ? (
            <li className="text-sm text-[var(--muted)]">No open programme tasks this week.</li>
          ) : null}
        </ul>
        <p className="mt-3 text-sm">
          <Link href="/programme" className="underline">
            Open 12-week plan to work these
          </Link>
        </p>
      </section>
    </div>
  );
}
