"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ActionFeedback } from "@/components/action-feedback";
import { apiMutate } from "@/components/simple-form";
import { guideForTask } from "@/lib/task-guides";
import { plainTaskStatus } from "@/lib/plain-labels";

type Dod = {
  id: string;
  label: string;
  satisfied: boolean;
  overridden: boolean;
};

export function TaskCoachCard({
  task,
}: {
  task: {
    id: string;
    title: string;
    status: string;
    resultNotes: string;
    dodCriteria: Dod[];
  };
}) {
  const guide = guideForTask(task.title);
  const router = useRouter();
  const [notes, setNotes] = useState(task.resultNotes ?? "");
  const [savingResult, setSavingResult] = useState(false);
  const [togglingDod, setTogglingDod] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [flash, setFlash] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const finished = task.status === "ACHIEVED";
  const dodComplete = task.dodCriteria.every((d) => d.satisfied || d.overridden);

  function bang(msg: string) {
    setFeedback(msg);
    setFlash((n) => n + 1);
  }

  async function saveResult() {
    setSavingResult(true);
    setError(null);
    try {
      await apiMutate(`/api/tasks/${task.id}/result`, {
        method: "POST",
        body: JSON.stringify({ resultNotes: notes }),
      });
      bang("Result saved — you can come back anytime.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save result");
    } finally {
      setSavingResult(false);
    }
  }

  async function toggleDod(criterionId: string, satisfied: boolean) {
    setTogglingDod(criterionId);
    setError(null);
    try {
      const res = await fetch(`/api/dod/${criterionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ satisfied: !satisfied }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not update checklist");
      bang(!satisfied ? "Checklist item marked done." : "Checklist item unmarked.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update checklist");
    } finally {
      setTogglingDod(null);
    }
  }

  async function finishTask() {
    setFinishing(true);
    setError(null);
    try {
      const res = await fetch(`/api/tasks/${task.id}/achieve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          overrideReason: dodComplete ? undefined : reason,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          data.code === "DOD_INCOMPLETE"
            ? "Tick the checklist first, or type a reason to finish anyway."
            : (data.error ?? "Could not finish task"),
        );
      }
      bang("Task finished and saved.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not finish task");
    } finally {
      setFinishing(false);
    }
  }

  return (
    <article
      className={`rounded-xl border p-4 sm:p-5 ${
        finished
          ? "border-[var(--border)] bg-[var(--surface-2)]/70"
          : "border-[var(--brand)]/35 bg-[var(--surface)]"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-[family-name:var(--font-display)] text-xl text-[var(--brand-dark)]">
            {guide.plainTitle}
          </h3>
          <p className="mt-1 text-xs text-[var(--muted)]">Programme name: {task.title}</p>
        </div>
        <Badge className={finished ? "bg-emerald-100" : ""}>
          {finished ? "Finished" : plainTaskStatus(task.status)}
        </Badge>
      </div>

      <p className="mt-3 text-sm">{guide.meaning}</p>

      <div className="mt-4 rounded-lg bg-[var(--surface-2)] p-3">
        <h4 className="text-sm font-semibold">How to do it</h4>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
          {guide.steps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
        {guide.openHref ? (
          <p className="mt-3">
            <Link
              href={guide.openHref}
              className="inline-flex min-h-11 items-center rounded-md bg-[var(--brand)] px-4 text-sm font-medium text-white transition active:scale-[0.98]"
            >
              {guide.openLabel ?? "Open the right page"}
            </Link>
          </p>
        ) : null}
      </div>

      <div className="mt-4 space-y-2">
        <h4 className="text-sm font-semibold">Your result (save here)</h4>
        <p className="text-xs text-[var(--muted)]">{guide.putResultHere}</p>
        <textarea
          className="min-h-28 w-full rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Type what you produced…"
          disabled={finished}
        />
        <Button type="button" onClick={saveResult} disabled={savingResult || finished}>
          {savingResult ? "Saving result…" : "Save result"}
        </Button>
      </div>

      <div className="mt-4 space-y-2">
        <h4 className="text-sm font-semibold">Checklist before finish</h4>
        <p className="text-xs text-[var(--muted)]">Done looks like: {guide.doneLooksLike}</p>
        <ul className="space-y-2">
          {task.dodCriteria.map((d) => {
            const done = d.satisfied || d.overridden;
            return (
              <li
                key={d.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-[var(--border)] bg-white/70 px-3 py-2 text-sm"
              >
                <span>
                  {done ? "Done — " : "Not done — "}
                  {d.label.replace(/^Evidence recorded for:\s*/i, "Evidence for: ")}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant={done ? "secondary" : "default"}
                  disabled={!!togglingDod || finished}
                  onClick={() => toggleDod(d.id, done)}
                >
                  {togglingDod === d.id
                    ? "Updating…"
                    : done
                      ? "Mark as not done"
                      : "Mark as done"}
                </Button>
              </li>
            );
          })}
        </ul>
      </div>

      {!finished ? (
        <div className="mt-4 space-y-2 border-t border-[var(--border)] pt-4">
          {!dodComplete ? (
            <input
              className="w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm"
              placeholder="Only if needed: reason to finish without full checklist"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          ) : null}
          <Button type="button" onClick={finishTask} disabled={finishing}>
            {finishing ? "Finishing…" : "Mark task finished"}
          </Button>
        </div>
      ) : (
        <p className="mt-4 text-sm text-emerald-800">This task is finished.</p>
      )}

      <div className="mt-3 space-y-2">
        <ActionFeedback message={feedback} flashKey={flash} />
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
      </div>
    </article>
  );
}
