import Link from "next/link";
import type { SessionUser } from "@/server/auth/session";
import { canAccessFounderDashboard, canManageProgramme } from "@/server/auth/rbac";
import { plainRole } from "@/lib/plain-labels";

const links = [
  { href: "/dashboard", label: "Home", show: (u: SessionUser) => canManageProgramme(u) },
  {
    href: "/founder",
    label: "Founder tasks",
    show: (u: SessionUser) => canAccessFounderDashboard(u),
  },
  {
    href: "/programme",
    label: "12-week plan",
    show: (u: SessionUser) => canManageProgramme(u),
  },
  { href: "/crm", label: "Contacts", show: (u: SessionUser) => canManageProgramme(u) },
  {
    href: "/interviews",
    label: "Interviews",
    show: (u: SessionUser) => canManageProgramme(u),
  },
  {
    href: "/economic",
    label: "Money & value",
    show: (u: SessionUser) => canManageProgramme(u),
  },
  {
    href: "/governance",
    label: "Decisions & docs",
    show: (u: SessionUser) => canManageProgramme(u),
  },
  {
    href: "/registration",
    label: "Register co-op",
    show: (u: SessionUser) => canManageProgramme(u),
  },
];

export function AppNav({ user }: { user: SessionUser }) {
  return (
    <header className="border-b border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-baseline gap-3">
          <Link
            href="/"
            className="font-[family-name:var(--font-display)] text-xl tracking-tight text-[var(--brand-dark)]"
          >
            CoopLaunch Malta
          </Link>
          <span className="text-xs text-[var(--muted)]">
            {user.name} · {plainRole(user.role)}
          </span>
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
