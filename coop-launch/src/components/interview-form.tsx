"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function InterviewForm({
  organisations,
}: {
  organisations: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [organisationId, setOrganisationId] = useState(
    organisations[0]?.id ?? "",
  );
  const [problemText, setProblemText] = useState("");
  const [problemTag, setProblemTag] = useState("");
  const [notes, setNotes] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organisationId,
          problemText,
          problemTag,
          notes,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(data.error ?? "Could not save interview");
        return;
      }
      setProblemText("");
      setProblemTag("");
      setNotes("");
      setMsg("Interview logged");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (!organisations.length) {
    return (
      <p className="text-sm text-[var(--muted)]">
        Add an organisation in CRM before logging interviews.
      </p>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--surface)]/80 p-4"
    >
      <h2 className="font-[family-name:var(--font-display)] text-lg">
        Save an interview
      </h2>
      <div className="space-y-1">
        <Label htmlFor="ivOrg">Company</Label>
        <select
          id="ivOrg"
          className="flex h-10 w-full rounded-md border border-[var(--border)] bg-transparent px-3 text-sm"
          value={organisationId}
          onChange={(e) => setOrganisationId(e.target.value)}
        >
          {organisations.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="problemText">What problem did they describe?</Label>
        <Input
          id="problemText"
          value={problemText}
          onChange={(e) => setProblemText(e.target.value)}
          required
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="problemTag">Short topic label</Label>
        <Input
          id="problemTag"
          value={problemTag}
          onChange={(e) => setProblemTag(e.target.value)}
          placeholder="e.g. Material delays"
          required
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="notes">Extra notes</Label>
        <Input
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      <Button type="submit" disabled={busy}>
        Save
      </Button>
      {msg ? <p className="text-sm text-[var(--muted)]">{msg}</p> : null}
    </form>
  );
}
