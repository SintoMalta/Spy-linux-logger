import Link from "next/link";
import type { SessionUser } from "@/server/auth/session";
import { canAccessFounderDashboard, canManageProgramme } from "@/server/auth/rbac";
import { plainRole } from "@/lib/plain-labels";

function navLinks(user: SessionUser) {
  const links: { href: string; label: string; show: boolean }[] = [
    {
      href: "/dashboard",
      label: "Home",
      show: canManageProgramme(user),
    },
    {
      href: "/daily-plan",
      label: "Your tasks",
      show: canManageProgramme(user),
    },
    {
      href: "/my-notes",
      label: "Your notes",
      show: canManageProgramme(user),
    },
    {
      href: "/app-issues",
      label: "App issues",
      show: canManageProgramme(user),
    },
    {
      href: "/founder",
      // Founder sees their own asks; Nesli sees the same page as "asks she sent"
      label: canManageProgramme(user) ? "Founder asks" : "Your tasks",
      show: canAccessFounderDashboard(user),
    },
    {
      href: "/programme",
      label: "12-week plan",
      show: canManageProgramme(user),
    },
    {
      href: "/crm",
      label: "Contacts",
      show: canManageProgramme(user),
    },
    {
      href: "/interviews",
      label: "Interviews",
      show: canManageProgramme(user),
    },
    {
      href: "/economic",
      label: "Money & value",
      show: canManageProgramme(user),
    },
    {
      href: "/governance",
      label: "Decisions & docs",
      show: canManageProgramme(user),
    },
    {
      href: "/registration",
      label: "Register co-op",
      show: canManageProgramme(user),
    },
  ];
  return links.filter((l) => l.show);
}

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
          {navLinks(user).map((l) => (
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
