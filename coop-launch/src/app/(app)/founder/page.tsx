import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { canAccessFounderDashboard } from "@/server/auth/rbac";
import { prisma } from "@/lib/prisma";
import { FounderActionButtons } from "@/components/founder-action-buttons";
import { Badge } from "@/components/ui/badge";

export default async function FounderDashboard() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  if (!canAccessFounderDashboard(user)) redirect("/dashboard");

  const assigneeFilter =
    user.role === "INDUSTRY_FOUNDER" ? { assigneeId: user.id } : {};

  const [actions, stages, people] = await Promise.all([
    prisma.founderActionRequest.findMany({
      where: { deletedAt: null, status: { in: ["OPEN", "DEFERRED"] }, ...assigneeFilter },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.stage.findMany({
      where: { deletedAt: null, status: { in: ["IN_PROGRESS", "COMPLETED"] } },
      orderBy: { weekNumber: "asc" },
      take: 3,
    }),
    prisma.person.findMany({
      where: { deletedAt: null, status: { not: "DO_NOT_PURSUE" } },
      take: 5,
      orderBy: { updatedAt: "desc" },
      include: { organisation: true },
    }),
  ]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--brand-dark)]">
          Needs from you
        </h1>
        <p className="mt-1 text-[var(--muted)]">
          Simple actions for this week — Done, Comment, Call Nesli, or Defer.
        </p>
      </header>

      <section className="space-y-4">
        {actions.map((a) => (
          <article
            key={a.id}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/80 p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold">{a.title}</h2>
                <p className="mt-1 text-sm text-[var(--muted)]">{a.detail}</p>
                {a.comment ? (
                  <p className="mt-2 text-sm">Last comment: {a.comment}</p>
                ) : null}
              </div>
              <Badge>{a.status}</Badge>
            </div>
            <FounderActionButtons actionId={a.id} />
          </article>
        ))}
        {actions.length === 0 ? (
          <p className="text-[var(--muted)]">No open requests. Thank you.</p>
        ) : null}
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/80 p-4">
          <h2 className="font-[family-name:var(--font-display)] text-lg">This week</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {stages.map((s) => (
              <li key={s.id}>
                Week {s.weekNumber}: {s.title}{" "}
                <Badge className="ml-2">{s.status}</Badge>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/80 p-4">
          <h2 className="font-[family-name:var(--font-display)] text-lg">People</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {people.map((p) => (
              <li key={p.id}>
                {p.name}
                {p.organisation ? ` · ${p.organisation.name}` : ""}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
