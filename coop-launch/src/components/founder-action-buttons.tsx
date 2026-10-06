"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ACTIONS = ["DONE", "COMMENT", "CALL_NESLI", "DEFER"] as const;

export function FounderActionButtons({ actionId }: { actionId: string }) {
  const router = useRouter();
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function send(action: (typeof ACTIONS)[number]) {
    setBusy(action);
    setError(null);
    try {
      const res = await fetch(`/api/founder-actions/${actionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, comment: comment || undefined }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed");
        return;
      }
      setComment("");
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mt-4 space-y-3">
      <Input
        placeholder="Optional comment"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
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
