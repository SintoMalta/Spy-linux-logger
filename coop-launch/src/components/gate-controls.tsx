"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiMutate } from "@/components/simple-form";

export function GateControls({ gateId }: { gateId: string }) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function run(path: string, body?: unknown) {
    setMessage(null);
    try {
      await apiMutate(path, {
        method: "POST",
        body: body ? JSON.stringify(body) : "{}",
      });
      setMessage("OK");
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed");
    }
  }

  return (
    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
      <Button type="button" variant="secondary" onClick={() => run(`/api/gates/${gateId}/evaluate`)}>
        Auto-evaluate gate
      </Button>
      <Button type="button" variant="secondary" onClick={() => run(`/api/gates/${gateId}/advance`)}>
        Advance if passed
      </Button>
      <Input placeholder="Override reason" value={reason} onChange={(e) => setReason(e.target.value)} />
      <Button type="button" variant="outline" onClick={() => run(`/api/gates/${gateId}/override`, { reason })}>
        Record override
      </Button>
      {message ? <p className="text-sm text-[var(--muted)]">{message}</p> : null}
    </div>
  );
}
