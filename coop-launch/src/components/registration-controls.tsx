"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function RegistrationControls({
  itemId,
  completed,
  documents,
  evidenceDocumentId,
}: {
  itemId: string;
  completed: boolean;
  evidenceDocumentId: string | null;
  documents: { id: string; filename: string }[];
}) {
  const router = useRouter();
  const [docId, setDocId] = useState(evidenceDocumentId ?? "");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save(nextCompleted: boolean) {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/registration/${itemId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          completed: nextCompleted,
          evidenceDocumentId: docId || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(data.error ?? "Update failed");
        return;
      }
      setMsg("Saved");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
      <select
        className="flex h-10 rounded-md border border-[var(--border)] bg-transparent px-3 text-sm"
        value={docId}
        onChange={(e) => setDocId(e.target.value)}
      >
        <option value="">No evidence document</option>
        {documents.map((d) => (
          <option key={d.id} value={d.id}>
            {d.filename}
          </option>
        ))}
      </select>
      <Button type="button" disabled={busy} onClick={() => save(!completed)}>
        {completed ? "Mark open" : "Mark complete"}
      </Button>
      {msg ? <span className="text-sm text-[var(--muted)]">{msg}</span> : null}
    </div>
  );
}
