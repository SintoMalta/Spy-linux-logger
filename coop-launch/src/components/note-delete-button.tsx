"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { apiMutate } from "@/components/simple-form";

export function NoteDeleteButton({ noteId }: { noteId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function remove() {
    setBusy(true);
    try {
      await apiMutate(`/api/notes/${noteId}`, {
        method: "PATCH",
        body: JSON.stringify({ softDelete: true }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={remove}>
      {busy ? "Removing…" : "Remove"}
    </Button>
  );
}
