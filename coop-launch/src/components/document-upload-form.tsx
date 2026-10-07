"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function DocumentUploadForm({
  linkedType,
  linkedId,
}: {
  linkedType?: string;
  linkedId?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const form = new FormData(e.currentTarget);
      if (linkedType) form.set("linkedType", linkedType);
      if (linkedId) form.set("linkedId", linkedId);
      const res = await fetch("/api/documents", {
        method: "POST",
        body: form,
        credentials: "same-origin",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      router.refresh();
      e.currentTarget.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <input name="file" type="file" required className="block w-full text-sm" accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.docx" />
      <Button type="submit" disabled={busy}>
        {busy ? "Uploading…" : "Upload document"}
      </Button>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </form>
  );
}
