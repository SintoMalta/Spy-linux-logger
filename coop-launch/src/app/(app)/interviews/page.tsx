import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { canManageProgramme } from "@/server/auth/rbac";
import { prisma } from "@/lib/prisma";
import { getProblemMatrix } from "@/server/market/problem-matrix";
import { Badge } from "@/components/ui/badge";
import { InterviewForm } from "@/components/interview-form";

export default async function InterviewsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  if (!canManageProgramme(user)) redirect("/founder");

  const [interviews, matrix, assessments, organisations] = await Promise.all([
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
      orderBy: { updatedAt: "desc" },
    }),
    prisma.organisation.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--brand-dark)]">
          Interviews & Problem Matrix
        </h1>
        <p className="mt-1 text-[var(--muted)]">
          Aggregated tags only in the matrix — confidential financial answers stay role-scoped.
        </p>
      </header>

      <InterviewForm organisations={organisations} />

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/80 p-4">
        <h2 className="font-[family-name:var(--font-display)] text-lg">Problem Matrix</h2>
        <ul className="mt-3 space-y-2">
          {matrix.map((row) => (
            <li key={row.tag} className="flex justify-between gap-3 text-sm">
              <span>{row.tag}</span>
              <Badge>{row.count}</Badge>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-lg">Interviews</h2>
        {interviews.map((iv) => (
          <article
            key={iv.id}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/80 p-4 text-sm"
          >
            <div className="font-medium">
              {iv.organisation?.name ?? "Org"} · {iv.person?.name ?? "Person"}
            </div>
            <ul className="mt-2 space-y-1 text-[var(--muted)]">
              {iv.answers.map((a) => (
                <li key={a.id}>
                  {a.question.prompt}:{" "}
                  {a.question.kind === "CONFIDENTIAL_FINANCIAL"
                    ? a.valueNumber ?? a.valueText ?? "—"
                    : a.valueText ?? String(a.valueNumber ?? a.valueBool ?? "—")}
                  {a.tags.length
                    ? ` [${a.tags.map((t) => t.tag.name).join(", ")}]`
                    : ""}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-lg">
          Founder assessments
        </h2>
        <p className="text-sm text-[var(--muted)]">
          Red-flag prompts are questions to explore — not verdicts.
        </p>
        {assessments.map((a) => (
          <article
            key={a.id}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/80 p-4"
          >
            <h3 className="font-medium">{a.title}</h3>
            <p className="mt-2 text-sm">
              <strong>Positive indicators:</strong> {a.positiveNotes}
            </p>
            <p className="mt-1 text-sm">
              <strong>Red-flag prompts:</strong> {a.redFlagPrompts}
            </p>
            <p className="mt-1 text-sm text-[var(--muted)]">{a.evidenceNotes}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
