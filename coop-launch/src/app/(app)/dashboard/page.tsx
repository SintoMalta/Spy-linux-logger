import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { canManageProgramme } from "@/server/auth/rbac";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { getRegistrationReadiness } from "@/server/registration/readiness";
import { PlanItemToggle } from "@/components/plan-item-toggle";
import { FounderActionCreate } from "@/components/founder-action-create";

export default async function CoordinatorDashboard() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  if (!canManageProgramme(user)) redirect("/founder");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [stages, openActions, waitingTasks, plan, readiness, recentAudits, founders] =
    await Promise.all([
      prisma.stage.findMany({
        where: { deletedAt: null },
        orderBy: { weekNumber: "asc" },
        include: { gate: { include: { criteria: true, overrides: true } } },
      }),
      prisma.founderActionRequest.findMany({
        where: { status: "OPEN", deletedAt: null },
        include: { assignee: true },
        take: 8,
      }),
      prisma.task.findMany({
        where: { status: { in: ["BLOCKED", "IN_PROGRESS"] }, deletedAt: null },
        include: { stage: true },
        take: 10,
        orderBy: { updatedAt: "desc" },
      }),
      prisma.dailyPlan.findFirst({
        where: { userId: user.id, date: today },
        include: { items: { orderBy: { order: "asc" } } },
      }),
      getRegistrationReadiness(),
      prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
      prisma.user.findMany({
        where: {
          active: true,
          deletedAt: null,
          role: { in: ["INDUSTRY_FOUNDER", "FOUNDING_MEMBER"] },
        },
        select: { id: true, name: true, email: true },
        orderBy: { name: "asc" },
      }),
    ]);

  const current = stages.find((s) => s.status === "IN_PROGRESS") ?? stages[0];
  const gate = current?.gate;
  const unmet =
    gate?.criteria.filter((c) => !c.satisfied).length ?? 0;
  const overridden = (gate?.overrides.length ?? 0) > 0;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--brand-dark)]">
          Coordinator dashboard
        </h1>
        <p className="mt-1 text-[var(--muted)]">
          Status, daily plan, waiting items, founder needs, and gate blockers.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Current week" value={current ? `W${current.weekNumber}` : "—"} hint={current?.title} />
        <Stat
          label="Gate"
          value={overridden ? "Override" : unmet === 0 ? "Ready" : `${unmet} open`}
          hint={gate?.title}
        />
        <Stat
          label="Registration"
          value={`${readiness.percent}%`}
          hint={readiness.blocked ? "Mandatory blockers" : "Clear"}
        />
        <Stat label="Open founder asks" value={String(openActions.length)} />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Panel title="Today’s 4h plan">
          {plan ? (
            <ul className="space-y-2">
              {plan.items.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3 text-sm"
                >
                  <span className={item.done ? "line-through opacity-60" : ""}>
                    {item.title}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="text-[var(--muted)]">{item.minutes}m</span>
                    <PlanItemToggle itemId={item.id} done={item.done} />
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[var(--muted)]">No plan for today yet.</p>
          )}
        </Panel>

        <Panel title="Needs from founder">
          <ul className="space-y-3">
            {openActions.map((a) => (
              <li key={a.id} className="text-sm">
                <div className="font-medium">{a.title}</div>
                <div className="text-[var(--muted)]">{a.assignee.name}</div>
              </li>
            ))}
            {openActions.length === 0 ? (
              <li className="text-sm text-[var(--muted)]">Nothing waiting.</li>
            ) : null}
          </ul>
        </Panel>

        <Panel title="Priorities & waiting">
          <ul className="space-y-2">
            {waitingTasks.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-2 text-sm">
                <Link href="/programme" className="hover:underline">
                  {t.title}
                </Link>
                <Badge>{t.status}</Badge>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Gate criteria">
          {gate ? (
            <ul className="space-y-2">
              {gate.criteria.map((c) => (
                <li key={c.id} className="flex items-center justify-between text-sm">
                  <span>{c.label}</span>
                  <Badge className={c.satisfied ? "bg-emerald-100" : ""}>
                    {c.satisfied ? "Met" : "Open"}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[var(--muted)]">No gate on current stage.</p>
          )}
        </Panel>
      </section>

      <FounderActionCreate assignees={founders} />

      <Panel title="Recent audit">
        <ul className="space-y-1 text-sm text-[var(--muted)]">
          {recentAudits.map((a) => (
            <li key={a.id}>
              {a.createdAt.toISOString().slice(0, 16)} · {a.action} · {a.entityType}
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/80 p-4">
      <div className="text-xs uppercase tracking-wide text-[var(--muted)]">
        {label}
      </div>
      <div className="mt-1 font-[family-name:var(--font-display)] text-2xl">
        {value}
      </div>
      {hint ? <div className="mt-1 text-xs text-[var(--muted)]">{hint}</div> : null}
    </div>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/80 p-4">
      <h2 className="mb-3 font-[family-name:var(--font-display)] text-lg">
        {title}
      </h2>
      {children}
    </section>
  );
}
