"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function GateCriterionToggle({
  criterionId,
  satisfied,
}: {
  criterionId: string;
  satisfied: boolean;
}) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function setSatisfied(next: boolean) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/gate-criteria/${criterionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          satisfied: next,
          evidenceNote: note || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Could not update");
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-center">
      <Input
        placeholder="Optional note (what proves this is done)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <Button
        type="button"
        size="sm"
        disabled={loading}
        onClick={() => setSatisfied(!satisfied)}
      >
        {satisfied ? "Mark as not done" : "Mark checklist item done"}
      </Button>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
