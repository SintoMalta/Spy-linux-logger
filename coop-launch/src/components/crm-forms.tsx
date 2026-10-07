"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CrmForms({
  organisations,
}: {
  organisations: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [orgName, setOrgName] = useState("");
  const [sector, setSector] = useState("");
  const [personName, setPersonName] = useState("");
  const [orgId, setOrgId] = useState(organisations[0]?.id ?? "");
  const [roleTitle, setRoleTitle] = useState("");
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function createOrg(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/crm/organisations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: orgName, sector }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(data.error ?? "Could not create organisation");
        return;
      }
      setOrgName("");
      setSector("");
      setMsg("Organisation added");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function createPerson(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/crm/people", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: personName,
          organisationId: orgId || undefined,
          roleTitle,
          email,
          status: "CONTACTED",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(data.error ?? "Could not create contact");
        return;
      }
      setPersonName("");
      setRoleTitle("");
      setEmail("");
      setMsg("Contact added");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6 rounded-xl border border-[var(--border)] bg-[var(--surface)]/80 p-4">
      <h2 className="font-[family-name:var(--font-display)] text-lg">
        Add a company or person
      </h2>
      {msg ? <p className="text-sm text-[var(--muted)]">{msg}</p> : null}

      <form onSubmit={createOrg} className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <Label htmlFor="orgName">Company name</Label>
          <Input
            id="orgName"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="sector">Sector</Label>
          <Input
            id="sector"
            value={sector}
            onChange={(e) => setSector(e.target.value)}
          />
        </div>
        <div className="flex items-end">
          <Button type="submit" disabled={busy} className="w-full">
            Add company
          </Button>
        </div>
      </form>

      <form onSubmit={createPerson} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="space-y-1">
          <Label htmlFor="personName">Person name</Label>
          <Input
            id="personName"
            value={personName}
            onChange={(e) => setPersonName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="orgId">Company</Label>
          <select
            id="orgId"
            className="flex h-10 w-full rounded-md border border-[var(--border)] bg-transparent px-3 text-sm"
            value={orgId}
            onChange={(e) => setOrgId(e.target.value)}
          >
            <option value="">None</option>
            {organisations.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="roleTitle">Role</Label>
          <Input
            id="roleTitle"
            value={roleTitle}
            onChange={(e) => setRoleTitle(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="flex items-end">
          <Button type="submit" disabled={busy} className="w-full">
            Add person
          </Button>
        </div>
      </form>
    </div>
  );
}
