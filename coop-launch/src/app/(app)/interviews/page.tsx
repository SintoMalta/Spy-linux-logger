import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { canManageProgramme } from "@/server/auth/rbac";
import { prisma } from "@/lib/prisma";
import { getProblemMatrix } from "@/server/market/problem-matrix";
import { Badge } from "@/components/ui/badge";
import { SimpleForm } from "@/components/simple-form";
import { InterviewCreateForm } from "@/components/interview-create-form";

export default async function InterviewsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  if (!canManageProgramme(user)) redirect("/founder");

  const [template, people, orgs, interviews, matrix, assessments] = await Promise.all([
    prisma.interviewTemplate.findFirst({
      where: { name: "Construction discovery v1" },
      include: { questions: { orderBy: { order: "asc" } } },
    }),
    prisma.person.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } }),
    prisma.organisation.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } }),
    prisma.interview.findMany({
      where: { deletedAt: null },
      include: {
        organisation: true,
        person: true,
        answers: { include: { question: true, tags: { include: { tag: true } } } },
      },
      orderBy: { conductedAt: "desc" },
    }),
    getProblemMatrix(user),
    prisma.founderAssessment.findMany({
      where: { deletedAt: null },
      include: { person: true, organisation: true },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--brand-dark)]">
          Interviews & assessments
        </h1>
        <p className="mt-1 text-[var(--muted)]">
          Enter interviews, tag problems, keep confidential finance role-scoped. Problem Matrix from COMPLETED only.
        </p>
      </header>

      {template ? (
        <InterviewCreateForm
          templateId={template.id}
          questions={template.questions.map((q) => ({
            id: q.id,
            prompt: q.prompt,
            kind: q.kind,
            topic: q.topic,
          }))}
          people={people.map((p) => ({ id: p.id, name: p.name }))}
          organisations={orgs.map((o) => ({ id: o.id, name: o.name }))}
        />
      ) : null}

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/80 p-4">
        <h2 className="font-[family-name:var(--font-display)] text-lg">Problem Matrix</h2>
        <ul className="mt-3 space-y-2">
          {matrix.map((row) => (
            <li key={row.tag} className="flex justify-between gap-3 text-sm">
              <span>{row.tag}</span>
              <Badge>{row.count}</Badge>
            </li>
          ))}
          {matrix.length === 0 ? (
            <li className="text-sm text-[var(--muted)]">No completed interview tags yet.</li>
          ) : null}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-lg">Interviews</h2>
        {interviews.map((iv) => (
          <article key={iv.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/80 p-4 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="font-medium">
                {iv.organisation?.name ?? "Org"} · {iv.person?.name ?? "Person"}
              </div>
              <Badge>{iv.status}</Badge>
            </div>
            <ul className="mt-2 space-y-1 text-[var(--muted)]">
              {iv.answers.map((a) => (
                <li key={a.id}>
                  {a.question.prompt}:{" "}
                  {a.question.kind === "CONFIDENTIAL_FINANCIAL"
                    ? a.valueNumber ?? a.valueText ?? "—"
                    : a.valueText ?? String(a.valueNumber ?? a.valueBool ?? "—")}
                  {a.tags.length ? ` [${a.tags.map((t) => t.tag.name).join(", ")}]` : ""}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-lg">Founder assessments</h2>
        <p className="text-sm text-[var(--muted)]">Red-flag prompts are questions — not verdicts.</p>
        <SimpleForm
          action="/api/assessments"
          submitLabel="Create assessment"
          fields={[
            { name: "title", label: "Title", required: true },
            { name: "personId", label: "Person id", placeholder: people[0]?.id },
            { name: "organisationId", label: "Organisation id" },
            { name: "positiveNotes", label: "Positive indicators" },
            { name: "redFlagPrompts", label: "Red-flag prompts" },
            { name: "evidenceNotes", label: "Evidence notes" },
          ]}
        />
        {assessments.map((a) => (
          <article key={a.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/80 p-4">
            <h3 className="font-medium">{a.title}</h3>
            <p className="text-sm text-[var(--muted)]">
              {a.person?.name ?? a.organisation?.name ?? "—"} · {a.status}
              {a.founderReviewed ? " · founder reviewed" : ""}
            </p>
            <p className="mt-2 text-sm">
              <strong>Positive:</strong> {a.positiveNotes}
            </p>
            <p className="mt-1 text-sm">
              <strong>Prompts:</strong> {a.redFlagPrompts}
            </p>
          </article>
        ))}
      </section>
    </div>
  );
}
