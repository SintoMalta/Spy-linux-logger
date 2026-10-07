"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiMutate } from "@/components/simple-form";
import { Badge } from "@/components/ui/badge";

type Issue = {
  id: string;
  title: string;
  body: string;
  pageOrTab: string;
  status: string;
  updatedAt: string | Date;
};

const STATUS_LABEL: Record<string, string> = {
  OPEN: "Open",
  LOOKING: "Looking at it",
  FIXED: "Fixed",
};

export function AppIssuesQuickCapture({ recent }: { recent: Issue[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [pageOrTab, setPageOrTab] = useState("");
  const [body, setBody] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      await apiMutate("/api/app-issues", {
        method: "POST",
        body: JSON.stringify({ title, body, pageOrTab }),
      });
      setTitle("");
      setPageOrTab("");
      setBody("");
      setMsg("Issue saved for the builders");
      router.refresh();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <h2 className="font-[family-name:var(--font-display)] text-base text-[var(--brand-dark)]">
          App gaps / issues
        </h2>
        <p className="text-xs text-[var(--muted)]">
          Missing tabs, wrong labels, things that do not work — write them here.
        </p>
      </div>
      <Input
        placeholder="Short issue title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <Input
        placeholder="Which page or tab? (optional)"
        value={pageOrTab}
        onChange={(e) => setPageOrTab(e.target.value)}
      />
      <textarea
        className="min-h-24 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
        placeholder="What is wrong or missing?"
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <Button
        type="button"
        size="sm"
        variant="secondary"
        disabled={busy || !title.trim() || !body.trim()}
        onClick={save}
      >
        {busy ? "Saving…" : "Save issue"}
      </Button>
      {msg ? <p className="text-xs text-[var(--muted)]">{msg}</p> : null}
      <ul className="space-y-2 border-t border-[var(--border)] pt-3">
        {recent.slice(0, 4).map((i) => (
          <li key={i.id} className="text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium">{i.title}</span>
              <Badge>{STATUS_LABEL[i.status] ?? i.status}</Badge>
            </div>
            {i.pageOrTab ? (
              <div className="text-[var(--muted)]">Page: {i.pageOrTab}</div>
            ) : null}
          </li>
        ))}
        {recent.length === 0 ? (
          <li className="text-xs text-[var(--muted)]">No issues logged yet.</li>
        ) : null}
      </ul>
      <Link href="/app-issues" className="text-xs font-medium underline">
        Open all app issues
      </Link>
    </div>
  );
}

export function AppIssueStatusButtons({
  issueId,
  status,
}: {
  issueId: string;
  status: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function setStatus(next: "OPEN" | "LOOKING" | "FIXED") {
    setBusy(true);
    try {
      await apiMutate(`/api/app-issues/${issueId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: next }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {(["OPEN", "LOOKING", "FIXED"] as const).map((s) => (
        <Button
          key={s}
          type="button"
          size="sm"
          variant={status === s ? "default" : "outline"}
          disabled={busy || status === s}
          onClick={() => setStatus(s)}
        >
          {STATUS_LABEL[s]}
        </Button>
      ))}
    </div>
  );
}
