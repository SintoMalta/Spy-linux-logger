import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { canManageProgramme } from "@/server/auth/rbac";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { SimpleForm } from "@/components/simple-form";

export default async function CrmPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  if (!canManageProgramme(user)) redirect("/founder");
  const sp = await searchParams;

  const people = await prisma.person.findMany({
    where: {
      deletedAt: null,
      ...(sp.status ? { status: sp.status as never } : {}),
      ...(sp.trade ? { trade: sp.trade } : {}),
      ...(sp.potentialFounder === "1" ? { potentialFounder: true } : {}),
      ...(sp.followUpDue === "1" ? { followUpDate: { lte: new Date() } } : {}),
      ...(sp.q
        ? {
            OR: [
              { name: { contains: sp.q, mode: "insensitive" } },
              { trade: { contains: sp.q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: { organisation: true, communications: { take: 3, orderBy: { occurredAt: "desc" } } },
    orderBy: { name: "asc" },
  });

  const orgs = await prisma.organisation.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--brand-dark)]">
          CRM — construction
        </h1>
        <p className="mt-1 text-[var(--muted)]">
          Create/view/edit organisations & people, communications, follow-ups. Status includes DO_NOT_PURSUE.
        </p>
      </header>

      <form className="flex flex-wrap gap-2" method="get">
        <input name="q" defaultValue={sp.q} placeholder="Search name/trade" className="h-11 rounded-md border px-3" />
        <input name="trade" defaultValue={sp.trade} placeholder="Trade" className="h-11 rounded-md border px-3" />
        <input name="status" defaultValue={sp.status} placeholder="Status" className="h-11 rounded-md border px-3" />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="potentialFounder" value="1" defaultChecked={sp.potentialFounder === "1"} />
          Potential founder
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="followUpDue" value="1" defaultChecked={sp.followUpDue === "1"} />
          Follow-up due
        </label>
        <button className="rounded-md bg-[var(--brand)] px-4 text-white" type="submit">
          Filter
        </button>
      </form>

      <div className="grid gap-6 lg:grid-cols-2">
        <SimpleForm
          action="/api/organisations"
          submitLabel="Add organisation"
          fields={[
            { name: "name", label: "Organisation name", required: true },
            { name: "trade", label: "Trade (electrical/plumbing/builder/materials_supplier)" },
            { name: "locality", label: "Locality" },
            { name: "nextAction", label: "Next action" },
            { name: "followUpDate", label: "Follow-up date", type: "date" },
          ]}
        />
        <SimpleForm
          action="/api/people"
          submitLabel="Add person"
          fields={[
            { name: "name", label: "Person name", required: true },
            { name: "organisationId", label: "Organisation id", placeholder: orgs[0]?.id },
            { name: "trade", label: "Trade" },
            { name: "roleTitle", label: "Role title" },
            { name: "nextAction", label: "Next action" },
            { name: "followUpDate", label: "Follow-up date", type: "date" },
          ]}
        />
      </div>

      <section className="space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-lg">Organisations ({orgs.length})</h2>
        {orgs.map((org) => (
          <article key={org.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/80 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold">{org.name}</h3>
              <Badge>{org.status}</Badge>
            </div>
            <p className="text-sm text-[var(--muted)]">
              {org.trade} · {org.locality} · next: {org.nextAction || "—"}
              {org.potentialFounder ? " · potential founder" : ""}
            </p>
            <p className="text-xs text-[var(--muted)]">id: {org.id}</p>
          </article>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-lg">People ({people.length})</h2>
        {people.map((p) => (
          <article key={p.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/80 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold">
                {p.name}
                {p.organisation ? ` · ${p.organisation.name}` : ""}
              </h3>
              <Badge>{p.status}</Badge>
            </div>
            <p className="text-sm text-[var(--muted)]">
              {p.trade} · {p.nextAction || "no next action"}
              {p.followUpDate ? ` · follow-up ${p.followUpDate.toISOString().slice(0, 10)}` : ""}
            </p>
            <SimpleForm
              action="/api/communications"
              submitLabel="Log communication"
              fields={[
                { name: "personId", label: "Person id", placeholder: p.id, required: true },
                { name: "channel", label: "Channel", placeholder: "call/email/whatsapp", required: true },
                { name: "summary", label: "Summary", required: true },
              ]}
            />
          </article>
        ))}
      </section>
    </div>
  );
}
