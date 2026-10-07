"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { apiMutate } from "@/components/simple-form";

type Q = { id: string; prompt: string; kind: string; topic: string };

export function InterviewCreateForm({
  templateId,
  questions,
  people,
  organisations,
}: {
  templateId: string;
  questions: Q[];
  people: { id: string; name: string }[];
  organisations: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [personId, setPersonId] = useState(people[0]?.id ?? "");
  const [organisationId, setOrganisationId] = useState(organisations[0]?.id ?? "");
  const [notes, setNotes] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [tag, setTag] = useState("");
  const [status, setStatus] = useState<"DRAFT" | "COMPLETED">("DRAFT");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const payloadAnswers = questions.map((q) => {
        const raw = answers[q.id] ?? "";
        if (q.kind === "CONFIDENTIAL_FINANCIAL") {
          return {
            questionId: q.id,
            valueNumber: raw ? Number(raw) : null,
            confidential: true,
          };
        }
        if (q.kind === "TAG") {
          return {
            questionId: q.id,
            valueText: tag || raw,
            tagNames: tag ? [tag] : raw ? [raw] : [],
          };
        }
        return { questionId: q.id, valueText: raw };
      });
      await apiMutate("/api/interviews", {
        method: "POST",
        body: JSON.stringify({
          templateId,
          personId: personId || null,
          organisationId: organisationId || null,
          notes,
          status,
          answers: payloadAnswers,
        }),
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--surface)]/80 p-4">
      <h2 className="font-[family-name:var(--font-display)] text-lg">New interview</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          Person
          <select
            className="mt-1 h-11 w-full rounded-md border px-2"
            value={personId}
            onChange={(e) => setPersonId(e.target.value)}
          >
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Organisation
          <select
            className="mt-1 h-11 w-full rounded-md border px-2"
            value={organisationId}
            onChange={(e) => setOrganisationId(e.target.value)}
          >
            {organisations.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      {questions.map((q) => (
        <label key={q.id} className="block text-sm">
          {q.prompt}
          {q.kind === "TAG" ? (
            <input
              className="mt-1 h-11 w-full rounded-md border px-3"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder="Problem tag"
            />
          ) : (
            <input
              className="mt-1 h-11 w-full rounded-md border px-3"
              value={answers[q.id] ?? ""}
              onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
              type={q.kind === "CONFIDENTIAL_FINANCIAL" ? "number" : "text"}
            />
          )}
        </label>
      ))}
      <label className="block text-sm">
        Notes
        <textarea
          className="mt-1 w-full rounded-md border px-3 py-2"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant={status === "DRAFT" ? "default" : "secondary"} onClick={() => setStatus("DRAFT")}>
          Draft
        </Button>
        <Button
          type="button"
          variant={status === "COMPLETED" ? "default" : "secondary"}
          onClick={() => setStatus("COMPLETED")}
        >
          Completed
        </Button>
        <Button type="button" onClick={submit} disabled={busy}>
          {busy ? "Saving…" : "Save interview"}
        </Button>
      </div>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </section>
  );
}
