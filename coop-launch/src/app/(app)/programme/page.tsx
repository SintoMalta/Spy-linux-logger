import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/server/auth/session";
import { canManageProgramme } from "@/server/auth/rbac";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { TaskCoachCard } from "@/components/task-coach-card";
import { WeekGateCoach } from "@/components/week-gate-coach";
import { plainStageStatus } from "@/lib/plain-labels";
import { plainWeek } from "@/lib/task-guides";

export default async function ProgrammePage() {
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

  const current = stages.find((s) => s.status === "IN_PROGRESS");

  return (
    <div className="space-y-8">
      <header className="rounded-xl border border-[var(--brand)]/30 bg-[var(--surface)] p-5">
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--brand-dark)]">
          12-week plan
        </h1>
        <p className="mt-2 text-[var(--muted)]">
          This is the full programme. Day-to-day work is easier on{" "}
          <Link href="/daily-plan" className="font-medium underline">
            What to do now
          </Link>
          . Below, each week explains what it is for; open a week to work the task cards.
        </p>
        {current ? (
          <p className="mt-3 rounded-lg bg-[var(--surface-2)] px-3 py-2 text-sm">
            <strong>Start here:</strong> {plainWeek(current.weekNumber, current.title).title}.{" "}
            <Link href="#this-week" className="underline">
              Jump to this week
            </Link>
            .
          </p>
        ) : null}
      </header>

      {stages.map((stage) => {
        const meta = plainWeek(stage.weekNumber, stage.title);
        const isCurrent = stage.status === "IN_PROGRESS";
        return (
          <section
            key={stage.id}
            id={isCurrent ? "this-week" : undefined}
            className={`rounded-xl border p-4 sm:p-5 ${
              isCurrent
                ? "border-[var(--brand)] bg-[var(--surface)]"
                : "border-[var(--border)] bg-[var(--surface)]/80"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-[family-name:var(--font-display)] text-xl">
                {isCurrent ? "This week — " : ""}
                {meta.title}
              </h2>
              <Badge>{plainStageStatus(stage.status)}</Badge>
            </div>
            <p className="mt-1 text-sm text-[var(--muted)]">{meta.meaning}</p>
            <p className="mt-1 text-xs text-[var(--muted)]">Official title: {stage.title}</p>

            <div className="mt-4 space-y-4">
              {stage.tasks.map((task) => (
                <TaskCoachCard key={task.id} task={task} />
              ))}
            </div>

            {stage.gate ? (
              <div className="mt-4">
                <WeekGateCoach gate={stage.gate} weekNumber={stage.weekNumber} />
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
