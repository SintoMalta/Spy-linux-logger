import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/server/auth/session";
import { canManageProgramme } from "@/server/auth/rbac";
import { prisma } from "@/lib/prisma";
import { TaskCoachCard } from "@/components/task-coach-card";
import { WeekGateCoach } from "@/components/week-gate-coach";
import { DutyWorkspaceMap } from "@/components/duty-workspace-map";
import { plainWeek } from "@/lib/task-guides";

export default async function DailyPlanPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  if (!canManageProgramme(user)) redirect("/founder");

  const stages = await prisma.stage.findMany({
    where: { deletedAt: null },
    orderBy: { weekNumber: "asc" },
    include: {
      tasks: {
        where: { deletedAt: null },
        include: { dodCriteria: { orderBy: { order: "asc" } } },
        orderBy: { title: "asc" },
      },
      gate: {
        include: {
          criteria: { orderBy: { order: "asc" } },
          overrides: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      },
    },
  });

  const current =
    stages.find((s) => s.status === "IN_PROGRESS") ??
    stages.find((s) => s.status === "NOT_STARTED") ??
    stages[0];

  const weekMeta = current
    ? plainWeek(current.weekNumber, current.title)
    : { title: "No active week", meaning: "Ask the operator to check the programme." };

  const openTasks = current?.tasks.filter((t) => t.status !== "ACHIEVED" && t.status !== "CANCELLED") ?? [];
  const doneCount = current?.tasks.filter((t) => t.status === "ACHIEVED").length ?? 0;
  const total = current?.tasks.length ?? 0;

  return (
    <div className="space-y-6">
      <header className="rounded-xl border border-[var(--brand)]/30 bg-[var(--surface)] p-5">
        <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Main work screen</p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl text-[var(--brand-dark)]">
          What to do now
        </h1>
        <p className="mt-2 text-[var(--muted)]">
          Read one card at a time. Each card tells you <strong>what</strong>, <strong>how</strong>,
          where to put the <strong>result</strong>, then how to mark it <strong>done</strong>.
        </p>
        <div className="mt-4 rounded-lg bg-[var(--surface-2)] p-3 text-sm">
          <div className="font-semibold">{weekMeta.title}</div>
          <p className="mt-1 text-[var(--muted)]">{weekMeta.meaning}</p>
          <p className="mt-2">
            Progress this week: <strong>{doneCount}</strong> of <strong>{total}</strong> tasks
            finished
            {openTasks.length > 0 ? ` · ${openTasks.length} still open` : " · all finished for this week"}
          </p>
        </div>
        <ol className="mt-4 list-decimal space-y-1 pl-5 text-sm">
          <li>Do the steps on the open task card</li>
          <li>Type your result and click <strong>Save result</strong> (wait for the green message)</li>
          <li>Click <strong>Mark as done</strong> on the checklist</li>
          <li>Click <strong>Mark task finished</strong></li>
          <li>When all tasks are finished, complete the week checklist at the bottom</li>
        </ol>
      </header>

      <section className="space-y-4">
        <h2 className="font-[family-name:var(--font-display)] text-xl">
          This week&apos;s tasks
        </h2>
        {openTasks.length === 0 ? (
          <p className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900">
            All programme tasks for this week are finished. Complete the week checklist below, then
            go to the next week.
          </p>
        ) : (
          openTasks.map((task) => <TaskCoachCard key={task.id} task={task} />)
        )}

        {current?.tasks
          .filter((t) => t.status === "ACHIEVED")
          .map((task) => <TaskCoachCard key={task.id} task={task} />)}
      </section>

      {current?.gate ? <WeekGateCoach gate={current.gate} weekNumber={current.weekNumber} /> : null}

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/80 p-4 text-sm">
        <h2 className="font-[family-name:var(--font-display)] text-lg">Need another area?</h2>
        <p className="mt-1 text-[var(--muted)]">
          Right side: Your notes + App issues. Top menu for every work space.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            ["/crm", "Contacts"],
            ["/interviews", "Interviews"],
            ["/governance", "Decisions & docs"],
            ["/founder", "Founder asks"],
            ["/registration", "Register co-op"],
            ["/programme", "All 12 weeks"],
          ].map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className="inline-flex min-h-11 items-center rounded-md border border-[var(--border)] bg-white px-3 text-sm font-medium transition active:scale-[0.97] hover:bg-[var(--surface-2)]"
            >
              {label}
            </Link>
          ))}
        </div>
      </section>

      <DutyWorkspaceMap />
    </div>
  );
}
