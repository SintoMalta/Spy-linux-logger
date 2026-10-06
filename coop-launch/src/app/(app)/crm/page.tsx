import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { canManageProgramme } from "@/server/auth/rbac";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { CrmForms } from "@/components/crm-forms";

export default async function CrmPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  if (!canManageProgramme(user)) redirect("/founder");

  const orgs = await prisma.organisation.findMany({
    where: { deletedAt: null },
    include: { people: { where: { deletedAt: null } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--brand-dark)]">
          CRM
        </h1>
        <p className="mt-1 text-[var(--muted)]">
          Organisations and people. Status includes DO_NOT_PURSUE.
        </p>
      </header>
      <CrmForms
        organisations={orgs.map((o) => ({ id: o.id, name: o.name }))}
      />
      <div className="space-y-4">
        {orgs.map((org) => (
          <article
            key={org.id}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/80 p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">{org.name}</h2>
              <Badge>{org.status}</Badge>
            </div>
            <p className="text-sm text-[var(--muted)]">
              {org.sector || "Sector unset"} · {org.notes}
            </p>
            <ul className="mt-3 space-y-1 text-sm">
              {org.people.map((p) => (
                <li key={p.id}>
                  {p.name}
                  {p.roleTitle ? ` — ${p.roleTitle}` : ""}{" "}
                  <Badge className="ml-1">{p.status}</Badge>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </div>
  );
}
