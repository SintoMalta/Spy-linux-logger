import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { canManageProgramme } from "@/server/auth/rbac";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { SimpleForm } from "@/components/simple-form";
import { TEMPLATE_BODIES } from "@/server/governance/decisions";
import { DocumentUploadForm } from "@/components/document-upload-form";

export default async function GovernancePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  if (!canManageProgramme(user)) redirect("/founder");

  const [advice, meetings, decisions, risks, templates, documents] = await Promise.all([
    prisma.adviceItem.findMany({ where: { deletedAt: null }, orderBy: { updatedAt: "desc" } }),
    prisma.meeting.findMany({
      where: { deletedAt: null },
      orderBy: { scheduledAt: "desc" },
      take: 20,
      include: { attendees: true },
    }),
    prisma.decision.findMany({ orderBy: { decidedAt: "desc" }, take: 20 }),
    prisma.risk.findMany({ where: { deletedAt: null }, orderBy: { rating: "desc" } }),
    prisma.template.findMany({ orderBy: { code: "asc" } }),
    prisma.document.findMany({ where: { deletedAt: null }, take: 20, orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--brand-dark)]">
          Governance pack
        </h1>
        <p className="mt-1 text-[var(--muted)]">
          Advice, meetings, decisions (immutable after finalise), risks, documents.
        </p>
      </header>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/80 p-4 space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-lg">Advice register</h2>
        <SimpleForm
          action="/api/advice"
          submitLabel="Add advice item"
          fields={[
            { name: "category", label: "Category", required: true },
            { name: "title", label: "Title", required: true },
            { name: "body", label: "Body", required: true },
            { name: "status", label: "Status", placeholder: "OPEN|AWAITING_RESPONSE|ANSWERED|FOLLOW_UP_REQUIRED|CLOSED" },
          ]}
        />
        <ul className="space-y-2 text-sm">
          {advice.map((a) => (
            <li key={a.id}>
              <span className="font-medium">{a.title}</span> · {a.category} <Badge>{a.status}</Badge>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/80 p-4 space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-lg">Meetings</h2>
        <SimpleForm
          action="/api/meetings"
          submitLabel="Create meeting"
          fields={[
            { name: "title", label: "Title", required: true },
            { name: "scheduledAt", label: "Scheduled at (ISO)", required: true, placeholder: new Date().toISOString() },
            { name: "location", label: "Location" },
            { name: "notes", label: "Notes" },
            { name: "actions", label: "Actions" },
          ]}
        />
        <ul className="space-y-2 text-sm">
          {meetings.map((m) => (
            <li key={m.id}>
              {m.scheduledAt.toISOString().slice(0, 10)} — {m.title}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/80 p-4 space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-lg">Decisions</h2>
        <SimpleForm
          action="/api/decisions"
          submitLabel="Create draft decision"
          fields={[
            { name: "title", label: "Title", required: true },
            { name: "body", label: "Body", required: true },
          ]}
        />
        <ul className="space-y-2 text-sm">
          {decisions.map((d) => (
            <li key={d.id}>
              <div className="font-medium">
                {d.title} <Badge>{d.status}</Badge>
              </div>
              <div className="text-[var(--muted)]">{d.body}</div>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/80 p-4 space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-lg">Risks</h2>
        <SimpleForm
          action="/api/risks"
          submitLabel="Add risk"
          fields={[
            { name: "title", label: "Title", required: true },
            { name: "probability", label: "Probability 1-5", type: "number", required: true },
            { name: "impact", label: "Impact 1-5", type: "number", required: true },
            { name: "mitigation", label: "Mitigation" },
            { name: "trigger", label: "Trigger" },
          ]}
        />
        <ul className="space-y-2 text-sm">
          {risks.map((r) => (
            <li key={r.id}>
              {r.title} · P{r.probability}/I{r.impact} = {r.rating} <Badge>{r.status}</Badge>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/80 p-4 space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-lg">Documents</h2>
        <DocumentUploadForm />
        <ul className="space-y-2 text-sm">
          {documents.map((d) => (
            <li key={d.id}>
              <a className="underline" href={`/api/documents/${d.id}/download`}>
                {d.filename}
              </a>{" "}
              v{d.version} · {d.visibility} · sha {d.sha256.slice(0, 8)}…
            </li>
          ))}
          {documents.length === 0 ? (
            <li className="text-[var(--muted)]">No uploads yet (local FS S3 driver).</li>
          ) : null}
        </ul>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/80 p-4">
        <h2 className="font-[family-name:var(--font-display)] text-lg">Templates §31–32</h2>
        <ul className="mt-3 space-y-3 text-sm">
          {templates.map((t) => (
            <li key={t.id}>
              <div className="font-medium">
                {t.code}: {t.name}
              </div>
              <p className="whitespace-pre-wrap text-[var(--muted)]">{t.body}</p>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-[var(--muted)]">
          Canonical lengths: intro {TEMPLATE_BODIES.SEC31_INTRO.length} · outreach{" "}
          {TEMPLATE_BODIES.SEC32_OUTREACH.length}
        </p>
      </section>
    </div>
  );
}
