import Link from "next/link";
import type { SessionUser } from "@/server/auth/session";
import { canAccessFounderDashboard, canManageProgramme } from "@/server/auth/rbac";

const links = [
  { href: "/dashboard", label: "Coordinator", show: (u: SessionUser) => canManageProgramme(u) },
  { href: "/founder", label: "Founder", show: (u: SessionUser) => canAccessFounderDashboard(u) },
  { href: "/programme", label: "Programme", show: (u: SessionUser) => canManageProgramme(u) },
  { href: "/daily-plan", label: "Daily plan", show: (u: SessionUser) => canManageProgramme(u) },
  { href: "/crm", label: "CRM", show: (u: SessionUser) => canManageProgramme(u) },
  { href: "/interviews", label: "Interviews", show: (u: SessionUser) => canManageProgramme(u) },
  { href: "/economic", label: "Economic", show: (u: SessionUser) => canManageProgramme(u) },
  { href: "/governance", label: "Governance", show: (u: SessionUser) => canManageProgramme(u) },
  { href: "/registration", label: "Registration", show: (u: SessionUser) => canManageProgramme(u) },
  { href: "/weekly-report", label: "Weekly report", show: (u: SessionUser) => canManageProgramme(u) },
];

export function AppNav({ user }: { user: SessionUser }) {
  return (
    <header className="border-b border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-baseline gap-3">
          <Link href="/" className="font-[family-name:var(--font-display)] text-xl tracking-tight text-[var(--brand-dark)]">
            CoopLaunch Malta
          </Link>
          <span className="text-xs text-[var(--muted)]">{user.name} · {user.role}</span>
        </div>
        <nav className="flex flex-wrap gap-2">
          {links
            .filter((l) => l.show(user))
            .map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-md px-3 py-2 text-sm font-medium text-[var(--ink)] hover:bg-[var(--surface-2)]"
              >
                {l.label}
              </Link>
            ))}
          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              className="rounded-md px-3 py-2 text-sm font-medium text-[var(--muted)] hover:bg-[var(--surface-2)]"
            >
              Log out
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
