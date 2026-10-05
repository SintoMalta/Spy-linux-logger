import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { canManageProgramme } from "@/server/auth/rbac";
import { prisma } from "@/lib/prisma";
import { filterOffersForRole } from "@/server/economic/finance";
import { Badge } from "@/components/ui/badge";
import { SimpleForm } from "@/components/simple-form";

export default async function EconomicPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  if (!canManageProgramme(user)) redirect("/founder");

  const [suppliers, assumptions, statements] = await Promise.all([
    prisma.supplier.findMany({
      where: { deletedAt: null },
      include: { offers: { where: { deletedAt: null } }, discussions: true },
    }),
    prisma.financialAssumption.findMany({
      where: { deletedAt: null },
      orderBy: [{ scenario: "asc" }, { key: "asc" }],
    }),
    prisma.memberValueStatement.findMany({ orderBy: { calculatedAt: "desc" }, take: 10 }),
  ]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--brand-dark)]">
          Economic validation
        </h1>
        <p className="mt-1 text-[var(--muted)]">
          Suppliers, labelled assumptions (CONSERVATIVE/BASE/UPSIDE), member value — no cross-member price leaks.
        </p>
      </header>

      <SimpleForm
        action="/api/suppliers"
        submitLabel="Add supplier"
        fields={[
          { name: "name", label: "Supplier name", required: true },
          { name: "category", label: "Category" },
          { name: "contact", label: "Contact" },
          { name: "notes", label: "Notes" },
        ]}
      />

      <section className="space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-lg">Suppliers</h2>
        {suppliers.map((s) => {
          const offers = filterOffersForRole(s.offers, user);
          return (
            <article key={s.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/80 p-4">
              <h3 className="font-medium">
                {s.name} <span className="text-[var(--muted)]">· {s.category}</span>
              </h3>
              <p className="text-xs text-[var(--muted)]">id: {s.id}</p>
              <ul className="mt-2 space-y-1 text-sm">
                {s.discussions.map((d) => (
                  <li key={d.id} className="text-[var(--muted)]">
                    Discussion: {d.summary}
                  </li>
                ))}
                {offers.map((o) => (
                  <li key={o.id} className="flex flex-wrap items-center gap-2">
                    <span>{o.description}</span>
                    <Badge>{o.assumptionConfidence}</Badge>
                    <span className="text-[var(--muted)]">
                      {o.unitPrice != null ? `${o.unitPrice} ${o.currency}` : "price hidden"}
                      {o.discountPct != null ? ` · ${o.discountPct}%` : ""}
                    </span>
                  </li>
                ))}
              </ul>
              <SimpleForm
                action={`/api/suppliers/${s.id}`}
                method="PATCH"
                submitLabel="Log discussion"
                fields={[{ name: "discussion", label: "Discussion summary", required: true }]}
              />
            </article>
          );
        })}
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/80 p-4 space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-lg">Financial assumptions</h2>
        <SimpleForm
          action="/api/assumptions"
          submitLabel="Upsert assumption"
          fields={[
            { name: "key", label: "Key", required: true, placeholder: "operating_cost" },
            { name: "label", label: "Label", required: true },
            { name: "value", label: "Value", required: true },
            { name: "unit", label: "Unit", placeholder: "EUR" },
            { name: "confidence", label: "Confidence VERIFIED|ESTIMATE|ASSUMPTION", required: true },
            { name: "scenario", label: "Scenario CONSERVATIVE|BASE|UPSIDE", required: true },
          ]}
        />
        <ul className="space-y-2 text-sm">
          {assumptions.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{a.label}</span>
              <span>
                {a.value}
                {a.unit ? ` ${a.unit}` : ""}
              </span>
              <Badge>{a.confidence}</Badge>
              <Badge>{a.scenario}</Badge>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/80 p-4 space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-lg">Member value</h2>
        <SimpleForm
          action="/api/member-value"
          submitLabel="Calculate & save"
          fields={[
            { name: "memberLabel", label: "Member label", required: true },
            { name: "annualSpend", label: "Annual spend", type: "number", required: true },
            { name: "coopDiscountPct", label: "Discount %", type: "number", required: true },
            { name: "membershipFee", label: "Membership fee", type: "number", required: true },
            { name: "hoursSaved", label: "Hours saved", type: "number", required: true },
            { name: "hourlyValue", label: "Hourly value", type: "number", required: true },
          ]}
        />
        <ul className="space-y-2 text-sm">
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
