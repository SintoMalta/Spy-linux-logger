import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { canManageProgramme } from "@/server/auth/rbac";
import { prisma } from "@/lib/prisma";
import { WeeklyReportEditor } from "@/components/weekly-report-editor";

export default async function WeeklyReportPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  if (!canManageProgramme(user)) redirect("/founder");

  const current =
    (await prisma.stage.findFirst({ where: { status: "IN_PROGRESS" } })) ??
    (await prisma.stage.findFirst({ orderBy: { weekNumber: "asc" } }));
  const weekNumber = current?.weekNumber ?? 1;
  const existing = await prisma.weeklyReport.findFirst({
    where: { weekNumber, authoredById: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--brand-dark)]">
          Weekly report
        </h1>
        <p className="mt-1 text-[var(--muted)]">
          Prefill from live data, edit, then finalise. No fake AI.
        </p>
      </header>
      <WeeklyReportEditor weekNumber={weekNumber} initialBody={existing?.body ?? ""} />
    </div>
  );
}
