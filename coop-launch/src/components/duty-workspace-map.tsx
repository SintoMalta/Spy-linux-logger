import Link from "next/link";
import { NESLI_DUTIES } from "@/lib/nesli-duties";

export function DutyWorkspaceMap() {
  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/80 p-4">
      <h2 className="font-[family-name:var(--font-display)] text-lg text-[var(--brand-dark)]">
        Your work spaces (by duty)
      </h2>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Each main duty has a place in the app. Click through when you need that work.
      </p>
      <ul className="mt-4 space-y-3">
        {NESLI_DUTIES.map((d) => (
          <li key={d.duty} className="border-t border-[var(--border)] pt-3 text-sm first:border-t-0 first:pt-0">
            <div className="font-medium">{d.duty}</div>
            <div className="text-[var(--muted)]">
              Work in{" "}
              <Link href={d.href} className="underline">
                {d.where}
              </Link>
              — {d.how}
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm text-[var(--muted)]">
        Side boxes on every page: <strong>Your notes</strong> (personal) and{" "}
        <strong>App gaps / issues</strong> (tell builders what is missing).
      </p>
    </section>
  );
}
