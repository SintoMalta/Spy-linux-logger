"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { apiMutate } from "@/components/simple-form";

export function WeeklyReportEditor({
  weekNumber,
  initialBody,
}: {
  weekNumber: number;
  initialBody: string;
}) {
  const router = useRouter();
  const [body, setBody] = useState(initialBody);
  const [error, setError] = useState<string | null>(null);

  async function prefill() {
    setError(null);
    try {
      const res = await apiMutate("/api/weekly-report", {
        method: "POST",
        body: JSON.stringify({ weekNumber, prefill: true }),
      });
      setBody(res.data.body);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  }

  async function save(finalise: boolean) {
    setError(null);
    try {
      await apiMutate("/api/weekly-report", {
        method: "POST",
        body: JSON.stringify({ weekNumber, body, finalise }),
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  }

  return (
    <div className="space-y-3">
      <textarea
        className="min-h-80 w-full rounded-md border border-[var(--border)] bg-white p-3 font-mono text-sm"
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" onClick={prefill}>
          Prefill from data
        </Button>
        <Button type="button" onClick={() => save(false)}>
          Save draft
        </Button>
        <Button type="button" onClick={() => save(true)}>
          Finalise
        </Button>
      </div>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
