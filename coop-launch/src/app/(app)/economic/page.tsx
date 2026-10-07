import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { canManageProgramme } from "@/server/auth/rbac";
import { prisma } from "@/lib/prisma";
import { filterOffersForRole } from "@/server/economic/finance";
import { Badge } from "@/components/ui/badge";

export default async function EconomicPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  if (!canManageProgramme(user)) redirect("/founder");

  const [suppliers, assumptions, statements] = await Promise.all([
    prisma.supplier.findMany({
      where: { deletedAt: null },
      include: { offers: { where: { deletedAt: null } } },
    }),
    prisma.financialAssumption.findMany({
      where: { deletedAt: null },
      orderBy: [{ scenario: "asc" }, { key: "asc" }],
    }),
    prisma.memberValueStatement.findMany({ orderBy: { calculatedAt: "desc" }, take: 5 }),
  ]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--brand-dark)]">
          Money & value
        </h1>
        <p className="mt-1 text-[var(--muted)]">
          Supplier prices, money assumptions, and what a member might save. Private prices stay
          private.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-lg">Suppliers</h2>
        {suppliers.map((s) => {
          const offers = filterOffersForRole(s.offers, user);
          return (
            <article
              key={s.id}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/80 p-4"
            >
              <h3 className="font-medium">
                {s.name} <span className="text-[var(--muted)]">· {s.category}</span>
              </h3>
              <ul className="mt-2 space-y-1 text-sm">
                {offers.map((o) => (
                  <li key={o.id} className="flex flex-wrap items-center gap-2">
                    <span>{o.description}</span>
                    <Badge>{o.assumptionConfidence}</Badge>
                    <span className="text-[var(--muted)]">
                      {o.unitPrice != null
                        ? `${o.unitPrice} ${o.currency}`
                        : "price hidden"}
                    </span>
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/80 p-4">
        <h2 className="font-[family-name:var(--font-display)] text-lg">
          Money assumptions
        </h2>
        <ul className="mt-3 space-y-2 text-sm">
          {assumptions.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{a.label}</span>
              <span>
                {a.value}
                {a.unit ? ` ${a.unit}` : ""}
              </span>
              <Badge>{a.confidence}</Badge>
              {a.scenario ? <Badge>scenario {a.scenario}</Badge> : null}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/80 p-4">
        <h2 className="font-[family-name:var(--font-display)] text-lg">
          What a member might gain
        </h2>
        <ul className="mt-3 space-y-2 text-sm">
          {statements.map((s) => (
            <li key={s.id}>
              {s.memberLabel}: {JSON.stringify(s.resultJson)}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
