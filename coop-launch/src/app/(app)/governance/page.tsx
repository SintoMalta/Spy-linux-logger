import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { canManageProgramme } from "@/server/auth/rbac";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { TEMPLATE_BODIES } from "@/server/governance/decisions";
import { DocumentUpload } from "@/components/document-upload";

export default async function GovernancePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  if (!canManageProgramme(user)) redirect("/founder");

  const [advice, meetings, decisions, risks, templates, documents] =
    await Promise.all([
      prisma.adviceItem.findMany({ where: { deletedAt: null }, orderBy: { updatedAt: "desc" } }),
      prisma.meeting.findMany({ where: { deletedAt: null }, orderBy: { scheduledAt: "desc" }, take: 10 }),
      prisma.decision.findMany({ orderBy: { decidedAt: "desc" }, take: 10 }),
      prisma.risk.findMany({ where: { deletedAt: null }, orderBy: { rating: "desc" } }),
      prisma.template.findMany({ orderBy: { code: "asc" } }),
      prisma.document.findMany({ where: { deletedAt: null }, take: 10, orderBy: { createdAt: "desc" } }),
    ]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--brand-dark)]">
          Governance pack
        </h1>
        <p className="mt-1 text-[var(--muted)]">
          Advice, meetings, immutable decisions, risks, documents, and §31–32 templates.
        </p>
      </header>

      <Grid title="Advice">
        {advice.map((a) => (
          <li key={a.id} className="text-sm">
            <span className="font-medium">{a.title}</span> · {a.category}{" "}
            <Badge>{a.status}</Badge>
          </li>
        ))}
      </Grid>

      <Grid title="Meetings">
        {meetings.map((m) => (
          <li key={m.id} className="text-sm">
            {m.scheduledAt.toISOString().slice(0, 10)} — {m.title}
          </li>
        ))}
      </Grid>

      <Grid title="Decisions (immutable)">
        {decisions.map((d) => (
          <li key={d.id} className="text-sm">
            <div className="font-medium">{d.title}</div>
            <div className="text-[var(--muted)]">{d.body}</div>
          </li>
        ))}
      </Grid>

      <Grid title="Risks">
        {risks.map((r) => (
          <li key={r.id} className="text-sm">
            {r.title} · P{r.probability}/I{r.impact} = {r.rating}{" "}
            <Badge>{r.status}</Badge>
          </li>
        ))}
      </Grid>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/80 p-4">
        <h2 className="font-[family-name:var(--font-display)] text-lg">Documents</h2>
        <ul className="mt-3 space-y-2">
          {documents.length === 0 ? (
            <li className="text-sm text-[var(--muted)]">No uploads yet.</li>
          ) : (
            documents.map((d) => (
              <li key={d.id} className="text-sm">
                {d.filename} v{d.version} · {d.visibility}
              </li>
            ))
          )}
        </ul>
        <DocumentUpload />
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/80 p-4">
        <h2 className="font-[family-name:var(--font-display)] text-lg">Templates</h2>
        <ul className="mt-3 space-y-3 text-sm">
          {templates.map((t) => (
            <li key={t.id}>
              <div className="font-medium">
                {t.code}: {t.name}
              </div>
              <p className="text-[var(--muted)] whitespace-pre-wrap">{t.body}</p>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-[var(--muted)]">
          Canonical §31/§32 strings length check: intro {TEMPLATE_BODIES.SEC31_INTRO.length}{" "}
          chars · outreach {TEMPLATE_BODIES.SEC32_OUTREACH.length} chars.
        </p>
      </section>
    </div>
  );
}

function Grid({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/80 p-4">
      <h2 className="font-[family-name:var(--font-display)] text-lg">{title}</h2>
      <ul className="mt-3 space-y-2">{children}</ul>
    </section>
  );
}
