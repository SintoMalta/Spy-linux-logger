"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiMutate } from "@/components/simple-form";

export function AdviceCreateForm({
  advisers,
}: {
  advisers: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [category, setCategory] = useState("Legal");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [adviserId, setAdviserId] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      await apiMutate("/api/advice", {
        method: "POST",
        body: JSON.stringify({
          category,
          title,
          body,
          adviserId: adviserId || null,
        }),
      });
      setTitle("");
      setBody("");
      setAdviserId("");
      setMsg("Advice item saved");
      router.refresh();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--surface)]/80 p-4">
      <h2 className="font-[family-name:var(--font-display)] text-lg">Add advice item</h2>
      <p className="text-sm text-[var(--muted)]">
        Use this to coordinate advisers (questions, answers, follow-ups).
      </p>
      <div>
        <Label htmlFor="advCat">Category</Label>
        <Input id="advCat" value={category} onChange={(e) => setCategory(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="advTitle">Title</Label>
        <Input id="advTitle" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="advBody">Details</Label>
        <textarea
          id="advBody"
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      </div>
      {advisers.length > 0 ? (
        <div>
          <Label htmlFor="advWho">Adviser (optional)</Label>
          <select
            id="advWho"
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            value={adviserId}
            onChange={(e) => setAdviserId(e.target.value)}
          >
            <option value="">None</option>
            {advisers.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      <Button
        type="button"
        disabled={busy || !title.trim() || !body.trim()}
        onClick={save}
      >
        {busy ? "Saving…" : "Save advice"}
      </Button>
      {msg ? <p className="text-sm text-[var(--muted)]">{msg}</p> : null}
    </div>
  );
}
