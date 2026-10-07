"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiMutate } from "@/components/simple-form";

/** Minimal status/notes editor for CRM person or organisation */
export function CrmEditForm({
  kind,
  id,
  status,
  notes,
  nextAction,
}: {
  kind: "people" | "organisations";
  id: string;
  status: string;
  notes: string;
  nextAction: string;
}) {
  const router = useRouter();
  const [values, setValues] = useState({ status, notes, nextAction });
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setError(null);
    try {
      await apiMutate(`/api/${kind}/${id}`, {
        method: "PATCH",
        body: JSON.stringify(values),
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  }

  return (
    <div className="mt-2 space-y-2 rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-2">
      <Input
        value={values.status}
        onChange={(e) => setValues((v) => ({ ...v, status: e.target.value }))}
        placeholder="Status"
        aria-label="Status"
      />
      <Input
        value={values.nextAction}
        onChange={(e) => setValues((v) => ({ ...v, nextAction: e.target.value }))}
        placeholder="Next action"
      />
      <Input
        value={values.notes}
        onChange={(e) => setValues((v) => ({ ...v, notes: e.target.value }))}
        placeholder="Notes"
      />
      <Button type="button" size="sm" onClick={save}>
        Save edits
      </Button>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
