"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiMutate } from "@/components/simple-form";

const ACTIONS = ["DONE", "COMMENT", "CALL_NESLI", "DEFER"] as const;

export function FounderActionButtons({ actionId }: { actionId: string }) {
  const router = useRouter();
  const [comment, setComment] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function send(action: (typeof ACTIONS)[number]) {
    setBusy(action);
    setError(null);
    try {
      await apiMutate(`/api/founder-actions/${actionId}`, {
        method: "POST",
        body: JSON.stringify({
          action,
          comment: comment || undefined,
          followUpDate: action === "DEFER" ? followUpDate : undefined,
        }),
      });
      setComment("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mt-4 space-y-3">
      <Input placeholder="Optional comment" value={comment} onChange={(e) => setComment(e.target.value)} />
      <Input
        type="date"
        value={followUpDate}
        onChange={(e) => setFollowUpDate(e.target.value)}
        aria-label="Follow-up date for defer"
      />
      <div className="flex flex-wrap gap-2">
        {ACTIONS.map((a) => (
          <Button
            key={a}
            type="button"
            variant={a === "DONE" ? "default" : "secondary"}
            disabled={busy !== null}
            onClick={() => send(a)}
          >
            {busy === a ? "…" : a.replace("_", " ")}
          </Button>
        ))}
      </div>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
