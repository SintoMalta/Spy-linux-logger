"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function TaskAchieveControls({
  taskId,
  dodComplete,
}: {
  taskId: string;
  dodComplete: boolean;
}) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function achieve() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/tasks/${taskId}/achieve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          overrideReason: dodComplete ? undefined : reason,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          data.code === "DOD_INCOMPLETE"
            ? "Mark the checklist done first, or type a reason to finish anyway."
            : (data.error ?? "Could not finish task"),
        );
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
      {!dodComplete ? (
        <Input
          placeholder="Reason to finish without full checklist"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      ) : null}
      <Button type="button" onClick={achieve} disabled={loading}>
        {loading ? "Saving…" : "Mark task finished"}
      </Button>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
