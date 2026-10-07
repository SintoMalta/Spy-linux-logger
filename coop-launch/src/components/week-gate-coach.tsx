"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ActionFeedback } from "@/components/action-feedback";

type Criterion = {
  id: string;
  label: string;
  satisfied: boolean;
};

export function WeekGateCoach({
  gate,
  weekNumber,
}: {
  gate: {
    id: string;
    title: string;
    description: string;
    criteria: Criterion[];
    overrides: { reason: string }[];
  };
  weekNumber: number;
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [advancing, setAdvancing] = useState(false);
  const [skipping, setSkipping] = useState(false);
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<string | null>(null);
  const [flash, setFlash] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const allDone = gate.criteria.every((c) => c.satisfied) || gate.overrides.length > 0;

  function bang(msg: string) {
    setFeedback(msg);
    setFlash((n) => n + 1);
  }

  async function toggleCriterion(id: string, satisfied: boolean) {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/gate-criteria/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          satisfied: !satisfied,
          evidenceNote: notes[id] || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not update week checklist");
      bang(!satisfied ? "Week checklist item marked done." : "Week checklist item unmarked.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  }

  async function goNext() {
    setAdvancing(true);
    setError(null);
    try {
      const res = await fetch(`/api/gates/${gate.id}/advance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Finish the week checklist first");
      bang("Moved to the next week.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not advance");
    } finally {
      setAdvancing(false);
    }
  }

  async function skip() {
    setSkipping(true);
    setError(null);
    try {
      const res = await fetch(`/api/gates/${gate.id}/override`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Type a reason to skip");
      bang("Week skipped with reason — next week unlocked if available.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not skip");
    } finally {
      setSkipping(false);
    }
  }

  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
      <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--brand-dark)]">
        End of week {weekNumber} checklist
      </h2>
      <p className="mt-1 text-sm text-[var(--muted)]">
        {gate.description || gate.title}. Finish these before moving on.
      </p>

      <ul className="mt-4 space-y-3">
        {gate.criteria.map((c) => (
          <li key={c.id} className="rounded-lg border border-[var(--border)] bg-white/80 p-3">
            <div className="text-sm font-medium">
              {c.satisfied ? "Done — " : "Not done — "}
              {c.label}
            </div>
            <input
              className="mt-2 w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Optional note: what proves this is done"
              value={notes[c.id] ?? ""}
              onChange={(e) => setNotes((n) => ({ ...n, [c.id]: e.target.value }))}
            />
            <div className="mt-2">
              <Button
                type="button"
                size="sm"
                variant={c.satisfied ? "secondary" : "default"}
                disabled={busyId === c.id}
                onClick={() => toggleCriterion(c.id, c.satisfied)}
              >
                {busyId === c.id
                  ? "Updating…"
                  : c.satisfied
                    ? "Mark as not done"
                    : "Mark checklist item done"}
              </Button>
            </div>
          </li>
        ))}
      </ul>

      {gate.overrides[0] ? (
        <p className="mt-3 text-xs text-[var(--muted)]">
          Previously skipped with reason: {gate.overrides[0].reason}
        </p>
      ) : null}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button type="button" onClick={goNext} disabled={advancing || !allDone}>
          {advancing ? "Moving…" : "Go to next week"}
        </Button>
        <input
          className="min-h-11 flex-1 rounded-md border px-3 text-sm"
          placeholder="Reason to skip remaining checklist items"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <Button type="button" variant="outline" onClick={skip} disabled={skipping || !reason.trim()}>
          {skipping ? "Skipping…" : "Skip remaining items"}
        </Button>
      </div>

      <div className="mt-3 space-y-2">
        <ActionFeedback message={feedback} flashKey={flash} />
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        {!allDone ? (
          <p className="text-xs text-[var(--muted)]">
            “Go to next week” stays off until every checklist item is done (or you skip with a
            reason).
          </p>
        ) : null}
      </div>
    </section>
  );
}
