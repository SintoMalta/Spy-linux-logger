"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiMutate } from "@/components/simple-form";

type Plan = {
  id: string;
  endOfDayNotes: string;
  items: { id: string; title: string; minutes: number; done: boolean; blockKey: string | null }[];
};

export function DailyPlanEditor({
  plan,
  proposals,
}: {
  plan: Plan;
  proposals: string[];
}) {
  const router = useRouter();
  const [notes, setNotes] = useState(plan.endOfDayNotes ?? "");
  const [items, setItems] = useState(plan.items);
  const [error, setError] = useState<string | null>(null);

  async function save(endOfDay = false) {
    setError(null);
    try {
      await apiMutate("/api/daily-plan", {
        method: "PATCH",
        body: JSON.stringify({
          items: items.map((i) => ({ id: i.id, title: i.title, done: i.done, minutes: i.minutes })),
          endOfDayNotes: endOfDay ? notes : undefined,
        }),
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-3">
        {items.map((item, idx) => (
          <li key={item.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)]/80 p-3">
            <input
              type="checkbox"
              checked={item.done}
              onChange={(e) =>
                setItems((rows) =>
                  rows.map((r, i) => (i === idx ? { ...r, done: e.target.checked } : r)),
                )
              }
            />
            <Input
              value={item.title}
              onChange={(e) =>
                setItems((rows) =>
                  rows.map((r, i) => (i === idx ? { ...r, title: e.target.value } : r)),
                )
              }
            />
            <span className="text-sm text-[var(--muted)]">{item.minutes}m · {item.blockKey}</span>
          </li>
        ))}
      </ul>
      <label className="block text-sm">
        Notes for end of day
        <textarea
          className="mt-1 w-full rounded-md border px-3 py-2"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="What got done? What should wait until tomorrow?"
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => save(false)}>
          Save today’s list
        </Button>
        <Button type="button" variant="secondary" onClick={() => save(true)}>
          Save end-of-day notes
        </Button>
      </div>
      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
        <h2 className="font-medium">Ideas for tomorrow (suggestions only)</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
          {proposals.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-[var(--muted)]">
          These are suggestions. Nothing is written into tomorrow automatically.
        </p>
      </section>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
