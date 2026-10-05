"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiMutate } from "@/components/simple-form";

export function RegistrationControls({ requirementId }: { requirementId: string }) {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [evidenceDocumentId, setEvidenceDocumentId] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function save(completed: boolean) {
    setError(null);
    try {
      await apiMutate(`/api/registration/${requirementId}`, {
        method: "PATCH",
        body: JSON.stringify({
          completed,
          notes: notes || undefined,
          evidenceDocumentId: evidenceDocumentId || undefined,
        }),
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  }

  return (
    <div className="space-y-2">
      <Input placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
      <Input
        placeholder="Evidence document id (after upload, paste id if needed)"
        value={evidenceDocumentId}
        onChange={(e) => setEvidenceDocumentId(e.target.value)}
      />
      <div className="flex gap-2">
        <Button type="button" onClick={() => save(true)}>
          Mark complete
        </Button>
        <Button type="button" variant="secondary" onClick={() => save(false)}>
          Mark open
        </Button>
      </div>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
