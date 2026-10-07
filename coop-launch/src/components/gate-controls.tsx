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
    if (res.ok) {
      setMessage("Moved to the next week.");
      router.refresh();
      return;
    }
    setMessage(
      data.code === "GATE_BLOCKED"
        ? "Finish the checklist first, or skip with a reason."
        : (data.error ?? "Could not move to next week"),
    );
  }

  async function override() {
    setMessage(null);
    const res = await fetch(`/api/gates/${gateId}/override`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setMessage("Week closed with a skip reason.");
      router.refresh();
      return;
    }
    setMessage(data.error ?? "Could not skip. Add a reason first.");
  }

  return (
    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
      <Button type="button" variant="secondary" onClick={advance}>
        Go to next week
      </Button>
      <Input
        placeholder="Reason to skip remaining checklist items"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />
      <Button type="button" variant="outline" onClick={override}>
        Skip remaining items
      </Button>
      {message ? <p className="text-sm text-[var(--muted)]">{message}</p> : null}
    </div>
  );
}
