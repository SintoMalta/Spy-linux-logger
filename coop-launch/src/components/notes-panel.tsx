"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiMutate } from "@/components/simple-form";
import { ActionFeedback } from "@/components/action-feedback";

type Note = {
  id: string;
  title: string;
  body: string;
  updatedAt: string | Date;
};

export function NotesQuickCapture({ recent }: { recent: Note[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [flash, setFlash] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    setMsg(null);
    setError(null);
    try {
      await apiMutate("/api/notes", {
        method: "POST",
        body: JSON.stringify({ title, body }),
      });
      setTitle("");
      setBody("");
      setMsg("Note saved — open Your notes anytime to see it.");
      setFlash((n) => n + 1);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <h2 className="font-[family-name:var(--font-display)] text-base text-[var(--brand-dark)]">
          Your notes
        </h2>
        <p className="text-xs text-[var(--muted)]">
          Quick scratch pad. Saved notes stay available anytime.
        </p>
      </div>
      <Input
        placeholder="Short title (optional)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
        className="min-h-24 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
        placeholder="Write a note…"
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <Button type="button" size="sm" disabled={busy || !body.trim()} onClick={save}>
        {busy ? "Saving…" : "Save note"}
      </Button>
      <ActionFeedback message={msg} flashKey={flash} />
      {error ? <p className="text-xs text-red-700">{error}</p> : null}
      <ul className="space-y-2 border-t border-[var(--border)] pt-3">
        {recent.slice(0, 4).map((n) => (
          <li key={n.id} className="text-xs">
            <div className="font-medium">{n.title || "Untitled note"}</div>
            <div className="line-clamp-2 text-[var(--muted)]">{n.body}</div>
          </li>
        ))}
        {recent.length === 0 ? (
          <li className="text-xs text-[var(--muted)]">No notes yet.</li>
        ) : null}
      </ul>
      <Link href="/my-notes" className="text-xs font-medium underline">
        Open all notes
      </Link>
    </div>
  );
}
