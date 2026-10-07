"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ACTIONS = [
  { code: "DONE", label: "Done" },
  { code: "COMMENT", label: "Add comment" },
  { code: "CALL_NESLI", label: "Ask Nesli to call" },
  { code: "DEFER", label: "Do later" },
] as const;

export function FounderActionButtons({ actionId }: { actionId: string }) {
  const router = useRouter();
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function send(action: (typeof ACTIONS)[number]["code"]) {
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
        setError(data.error ?? "Could not save");
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
        placeholder="Write a short comment (optional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      <div className="flex flex-wrap gap-2">
        {ACTIONS.map((a) => (
          <Button
            key={a.code}
            type="button"
            variant={a.code === "DONE" ? "default" : "secondary"}
            disabled={busy !== null}
            onClick={() => send(a.code)}
          >
            {busy === a.code ? "…" : a.label}
          </Button>
        ))}
      </div>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
