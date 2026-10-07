import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { canManageProgramme } from "@/server/auth/rbac";
import { AppNav } from "@/components/app-nav";
import { CoordinatorSideRail } from "@/components/coordinator-side-rail";
import { listNotes } from "@/server/coordinator/notes";
import { listAppIssues } from "@/server/coordinator/app-issues";

export default async function AppSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const showSideRail = canManageProgramme(user);
  const [notes, issues] = showSideRail
    ? await Promise.all([listNotes(user, 8), listAppIssues(user, 8)])
    : [[], []];

  return (
    <div className="min-h-[100dvh]">
      <AppNav user={user} />
      <div className="mx-auto max-w-7xl px-4 py-6">
        {showSideRail ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="min-w-0">{children}</div>
            <CoordinatorSideRail notes={notes} issues={issues} />
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
