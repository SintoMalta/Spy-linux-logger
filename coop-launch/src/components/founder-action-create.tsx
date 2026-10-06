"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function FounderActionCreate({
  assignees,
}: {
  assignees: { id: string; name: string; email: string }[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [assigneeId, setAssigneeId] = useState(assignees[0]?.id ?? "");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/founder-actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, detail, assigneeId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(data.error ?? "Could not create ask");
        return;
      }
      setTitle("");
      setDetail("");
      setMsg("Ask sent to founder");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (assignees.length === 0) {
    return (
      <p className="text-sm text-[var(--muted)]">
        No founder users available to assign.
      </p>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--surface)]/80 p-4"
    >
      <h2 className="font-[family-name:var(--font-display)] text-lg">
        Ask founder to do something
      </h2>
      <div className="space-y-1">
        <Label htmlFor="askTitle">Title</Label>
        <Input
          id="askTitle"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="askDetail">Details</Label>
        <Input
          id="askDetail"
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="assignee">Assign to</Label>
        <select
          id="assignee"
          className="flex h-10 w-full rounded-md border border-[var(--border)] bg-transparent px-3 text-sm"
          value={assigneeId}
          onChange={(e) => setAssigneeId(e.target.value)}
        >
          {assignees.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} ({a.email})
            </option>
          ))}
        </select>
      </div>
      <Button type="submit" disabled={busy}>
        Send ask
      </Button>
      {msg ? <p className="text-sm text-[var(--muted)]">{msg}</p> : null}
    </form>
  );
}
