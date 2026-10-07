import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { canManageProgramme } from "@/server/auth/rbac";
import { prisma } from "@/lib/prisma";
import { getRegistrationReadiness } from "@/server/registration/readiness";
import { Badge } from "@/components/ui/badge";
import { RegistrationControls } from "@/components/registration-controls";

const PRIORITY: Record<string, string> = {
  MANDATORY: "Required",
  IMPORTANT: "Important",
  OPTIONAL: "Optional",
};

export default async function RegistrationPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  if (!canManageProgramme(user)) redirect("/founder");

  const [items, readiness, documents] = await Promise.all([
    prisma.registrationRequirement.findMany({ orderBy: { code: "asc" } }),
    getRegistrationReadiness(),
    prisma.document.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, filename: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--brand-dark)]">
          Register the co-op
        </h1>
        <p className="mt-1 text-[var(--muted)]">
          Checklist of what you need before registering. Required items need a supporting file.
        </p>
      </header>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/80 p-6">
        <div className="font-[family-name:var(--font-display)] text-4xl">
          {readiness.percent}%
        </div>
        <p className="mt-2 text-sm text-[var(--muted)]">
          {readiness.completed}/{readiness.total} done · required{" "}
          {readiness.mandatoryCompleted}/{readiness.mandatoryTotal}
          {readiness.blocked ? " · still missing required items" : " · ready"}
        </p>
        {readiness.blockers.length ? (
          <ul className="mt-3 space-y-1 text-sm text-amber-900">
            {readiness.blockers.map((b) => (
              <li key={b.code}>Still needed: {b.title}</li>
            ))}
          </ul>
        ) : null}
      </div>

      <ul className="space-y-3">
        {items.map((item) => (
          <li
            key={item.id}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/80 p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="font-medium">{item.title}</div>
                <p className="text-sm text-[var(--muted)]">{item.description}</p>
              </div>
              <div className="flex gap-2">
                <Badge>{PRIORITY[item.priority] ?? item.priority}</Badge>
                <Badge className={item.completed ? "bg-emerald-100" : ""}>
                  {item.completed ? "Done" : "Not done"}
                </Badge>
                <Badge>
                  {item.evidenceDocumentId ? "File attached" : "No file yet"}
                </Badge>
              </div>
            </div>
            <RegistrationControls
              itemId={item.id}
              completed={item.completed}
              evidenceDocumentId={item.evidenceDocumentId}
              documents={documents}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
