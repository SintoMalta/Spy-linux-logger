import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { canManageProgramme } from "@/server/auth/rbac";
import { listAppIssues } from "@/server/coordinator/app-issues";
import { AppIssuesQuickCapture, AppIssueStatusButtons } from "@/components/app-issues-panel";
import { Badge } from "@/components/ui/badge";

const STATUS_LABEL: Record<string, string> = {
  OPEN: "Open",
  LOOKING: "Looking at it",
  FIXED: "Fixed",
};

export default async function AppIssuesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  if (!canManageProgramme(user)) redirect("/founder");

  const issues = await listAppIssues(user, 200);
  const openCount = issues.filter((i) => i.status === "OPEN").length;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--brand-dark)]">
          App gaps / issues
        </h1>
        <p className="mt-1 text-[var(--muted)]">
          Log missing features, wrong tabs, or mismatches here. Builders review this list and
          implement fixes. Open right now: {openCount}.
        </p>
      </header>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/80 p-4 lg:max-w-xl">
        <AppIssuesQuickCapture recent={[]} />
      </section>

      <section className="space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-lg">All reported issues</h2>
        {issues.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">Nothing reported yet.</p>
        ) : (
          <ul className="space-y-3">
            {issues.map((i) => (
              <li
                key={i.id}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/80 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-medium">{i.title}</h3>
                  <Badge>{STATUS_LABEL[i.status] ?? i.status}</Badge>
                </div>
                {i.pageOrTab ? (
                  <p className="mt-1 text-xs text-[var(--muted)]">Page / tab: {i.pageOrTab}</p>
                ) : null}
                <p className="mt-2 whitespace-pre-wrap text-sm">{i.body}</p>
                <p className="mt-2 text-xs text-[var(--muted)]">
                  By {i.reporter.name} ·{" "}
                  {i.createdAt.toISOString().slice(0, 16).replace("T", " ")}
                </p>
                <AppIssueStatusButtons issueId={i.id} status={i.status} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
