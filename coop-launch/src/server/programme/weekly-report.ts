import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/server/auth/session";
import { AuthError } from "@/server/auth/session";
import { canManageProgramme } from "@/server/auth/rbac";
import { getRegistrationReadiness } from "@/server/registration/readiness";
import { collectMetrics } from "@/server/programme/metrics";

export async function buildWeeklyReportDraft(user: SessionUser, weekNumber: number) {
  if (!canManageProgramme(user)) {
    throw new AuthError("FORBIDDEN", "Insufficient permissions");
  }
  const [stage, metrics, readiness, actions, waiting] = await Promise.all([
    prisma.stage.findUnique({
      where: { weekNumber },
      include: { tasks: true, gate: { include: { criteria: true } } },
    }),
    collectMetrics(),
    getRegistrationReadiness(),
    prisma.founderActionRequest.count({ where: { status: "OPEN", deletedAt: null } }),
    prisma.task.count({ where: { status: "WAITING_EXTERNAL", deletedAt: null } }),
  ]);

  const lines = [
    `# Weekly report — Week ${weekNumber}`,
    "",
    `Stage: ${stage?.title ?? "n/a"} (${stage?.status ?? "n/a"})`,
    `Completed interviews: ${metrics.interviewCount}`,
    `Problem tags: ${metrics.problemTagCount}`,
    `Founder candidates: ${metrics.founderCandidateCount}`,
    `Supplier discussions/offers: ${metrics.supplierDiscussionCount}/${metrics.supplierOfferCount}`,
    `Open founder actions: ${actions}`,
    `Waiting external tasks: ${waiting}`,
    `Registration readiness: ${readiness.percent}%${readiness.blocked ? " (blocked)" : ""}`,
    "",
    "## Gate criteria",
    ...(stage?.gate?.criteria.map(
      (c) => `- ${c.label}: ${c.satisfied ? "met" : "open"} (${c.evidenceNote ?? ""})`,
    ) ?? ["- none"]),
    "",
    "## Coordinator notes",
    "(edit before finalise)",
  ];

  return lines.join("\n");
}

export async function upsertWeeklyReport(
  user: SessionUser,
  weekNumber: number,
  body: string,
  finalise = false,
) {
  if (!canManageProgramme(user)) {
    throw new AuthError("FORBIDDEN", "Insufficient permissions");
  }
  const existing = await prisma.weeklyReport.findFirst({
    where: { weekNumber, authoredById: user.id, status: "DRAFT" },
  });
  if (existing) {
    return prisma.weeklyReport.update({
      where: { id: existing.id },
      data: {
        body,
        status: finalise ? "FINAL" : "DRAFT",
        publishedAt: finalise ? new Date() : null,
      },
    });
  }
  return prisma.weeklyReport.create({
    data: {
      weekNumber,
      body,
      authoredById: user.id,
      status: finalise ? "FINAL" : "DRAFT",
      publishedAt: finalise ? new Date() : null,
    },
  });
}
