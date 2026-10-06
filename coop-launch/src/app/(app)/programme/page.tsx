import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { canManageProgramme } from "@/server/auth/rbac";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { TaskAchieveControls } from "@/components/task-achieve-controls";
import { GateControls } from "@/components/gate-controls";
import { DodToggle } from "@/components/dod-toggle";
import { GateCriterionToggle } from "@/components/gate-criterion-toggle";

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
          overrides: { orderBy: { createdAt: "desc" }, take: 3 },
        },
      },
    },
  });

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--brand-dark)]">
          Programme
        </h1>
        <p className="mt-1 text-[var(--muted)]">
          Twelve weeks · Definition of Done · Gates (Evidence → Decision → Gate).
        </p>
      </header>

      {stages.map((stage) => (
        <section
          key={stage.id}
          className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/80 p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-[family-name:var(--font-display)] text-xl">
              Week {stage.weekNumber}: {stage.title}
            </h2>
            <Badge>{stage.status}</Badge>
          </div>
          <p className="mt-1 text-sm text-[var(--muted)]">{stage.description}</p>

          <ul className="mt-4 space-y-4">
            {stage.tasks.map((task) => (
              <li key={task.id} className="border-t border-[var(--border)] pt-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-medium">{task.title}</div>
                  <Badge>{task.status}</Badge>
                </div>
                <ul className="mt-2 space-y-2 text-sm text-[var(--muted)]">
                  {task.dodCriteria.map((d) => (
                    <li key={d.id} className="space-y-1">
                      <div>
                        DoD: {d.label} —{" "}
                        {d.satisfied || d.overridden ? "met" : "open"}
                      </div>
                      <DodToggle
                        criterionId={d.id}
                        satisfied={d.satisfied || d.overridden}
                      />
                    </li>
                  ))}
                </ul>
                {task.status !== "ACHIEVED" ? (
                  <TaskAchieveControls
                    taskId={task.id}
                    dodComplete={task.dodCriteria.every(
                      (d) => d.satisfied || d.overridden,
                    )}
                  />
                ) : null}
              </li>
            ))}
          </ul>

          {stage.gate ? (
            <div className="mt-4 rounded-lg bg-[var(--surface-2)] p-3">
              <h3 className="font-medium">Gate: {stage.gate.title}</h3>
              <ul className="mt-2 space-y-3 text-sm">
                {stage.gate.criteria.map((c) => (
                  <li key={c.id}>
                    <div>
                      {c.label} [{c.type}] —{" "}
                      {c.satisfied ? "satisfied" : "open"}
                    </div>
                    <GateCriterionToggle
                      criterionId={c.id}
                      satisfied={c.satisfied}
                    />
                  </li>
                ))}
              </ul>
              {stage.gate.overrides[0] ? (
                <p className="mt-2 text-xs text-[var(--muted)]">
                  Override on file: {stage.gate.overrides[0].reason}
                </p>
              ) : null}
              <GateControls gateId={stage.gate.id} />
            </div>
          ) : null}
        </section>
      ))}
    </div>
  );
}
