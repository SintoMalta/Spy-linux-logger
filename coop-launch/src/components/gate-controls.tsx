"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function GateControls({ gateId }: { gateId: string }) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function advance() {
    setMessage(null);
    const res = await fetch(`/api/gates/${gateId}/advance`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setMessage(data.error ?? (res.ok ? "Advanced" : "Failed"));
    if (res.ok) router.refresh();
  }

  async function override() {
    setMessage(null);
    const res = await fetch(`/api/gates/${gateId}/override`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    const data = await res.json().catch(() => ({}));
    setMessage(data.error ?? (res.ok ? "Override recorded" : "Failed"));
    if (res.ok) router.refresh();
  }

  return (
    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
      <Button type="button" variant="secondary" onClick={advance}>
        Advance if gate passed
      </Button>
      <Input
        placeholder="Override reason"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />
      <Button type="button" variant="outline" onClick={override}>
        Record override
      </Button>
      {message ? <p className="text-sm text-[var(--muted)]">{message}</p> : null}
    </div>
  );
}
