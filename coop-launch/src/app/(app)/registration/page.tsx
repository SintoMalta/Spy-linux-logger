import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { canManageProgramme } from "@/server/auth/rbac";
import { prisma } from "@/lib/prisma";
import { getRegistrationReadiness } from "@/server/registration/readiness";
import { Badge } from "@/components/ui/badge";
import { DocumentUploadForm } from "@/components/document-upload-form";
import { RegistrationControls } from "@/components/registration-controls";

export default async function RegistrationPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  if (!canManageProgramme(user)) redirect("/founder");

  const [items, readiness, week9] = await Promise.all([
    prisma.registrationRequirement.findMany({ orderBy: { code: "asc" } }),
    getRegistrationReadiness(),
    prisma.programmeFlag.findUnique({ where: { key: "WEEK9_DECISION" } }),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--brand-dark)]">
          Registration readiness
        </h1>
        <p className="mt-1 text-[var(--muted)]">
          Mandatory blockers prevent 100%. Week 9 NO_GO blocks completion. Submission never auto-inferred.
        </p>
      </header>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/80 p-6">
        <div className="font-[family-name:var(--font-display)] text-4xl">{readiness.percent}%</div>
        <p className="mt-2 text-sm text-[var(--muted)]">
          {readiness.completed}/{readiness.total} complete · mandatory {readiness.mandatoryCompleted}/
          {readiness.mandatoryTotal}
          {readiness.blocked ? " · BLOCKED" : ""}
          {week9 ? ` · Week9=${week9.value}` : " · Week9 unset"}
        </p>
        {readiness.blockers.length ? (
          <ul className="mt-3 space-y-1 text-sm text-amber-900">
            {readiness.blockers.map((b) => (
              <li key={b.code}>
                Blocker: {b.code} — {b.title}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/80 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="font-medium">
                  {item.code}: {item.title}
                </div>
                <p className="text-sm text-[var(--muted)]">{item.description}</p>
                {item.notes ? <p className="text-sm">Notes: {item.notes}</p> : null}
              </div>
              <div className="flex gap-2">
                <Badge>{item.priority}</Badge>
                <Badge className={item.completed ? "bg-emerald-100" : ""}>
                  {item.completed ? "Done" : "Open"}
                </Badge>
                <Badge>{item.evidenceDocumentId ? "Evidence" : "No evidence"}</Badge>
              </div>
            </div>
            <DocumentUploadForm linkedType="RegistrationRequirement" linkedId={item.id} />
            <RegistrationControls requirementId={item.id} />
          </li>
        ))}
      </ul>
    </div>
  );
}
