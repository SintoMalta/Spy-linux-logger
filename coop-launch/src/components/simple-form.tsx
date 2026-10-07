"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export async function apiMutate(url: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if (!(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(url, { ...init, headers, credentials: "same-origin" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
  return data;
}

export function SimpleForm({
  action,
  method = "POST",
  fields,
  submitLabel = "Save",
  onDone,
}: {
  action: string;
  method?: "POST" | "PATCH";
  fields: { name: string; label: string; type?: string; placeholder?: string; required?: boolean }[];
  submitLabel?: string;
  onDone?: () => void;
}) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = { ...values };
      for (const f of fields) {
        if (f.type === "number" && values[f.name] !== undefined && values[f.name] !== "") {
          payload[f.name] = Number(values[f.name]);
        }
        if (f.type === "checkbox") {
          payload[f.name] = values[f.name] === "true";
        }
      }
      await apiMutate(action, { method, body: JSON.stringify(payload) });
      setValues({});
      onDone?.();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-3">
      {fields.map((f) => (
        <div key={f.name} className="space-y-1">
          <label className="text-sm font-medium" htmlFor={f.name}>
            {f.label}
          </label>
          <Input
            id={f.name}
            type={f.type ?? "text"}
            required={f.required}
            placeholder={f.placeholder}
            value={values[f.name] ?? ""}
            onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
          />
        </div>
      ))}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <Button type="submit" disabled={busy}>
        {busy ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
