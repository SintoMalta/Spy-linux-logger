import { prisma } from "@/lib/prisma";
import { AuthError, type SessionUser } from "@/server/auth/session";
import { canManageProgramme } from "@/server/auth/rbac";
import { writeAudit } from "@/server/audit";
import { DomainError } from "@/server/programme/task-service";
import type { AppIssueStatus } from "@prisma/client";

function assertCoordinator(user: SessionUser) {
  if (!canManageProgramme(user)) {
    throw new AuthError("FORBIDDEN", "App issues are for the coordinator");
  }
}

export async function listAppIssues(user: SessionUser, take = 100) {
  assertCoordinator(user);
  return prisma.appIssueReport.findMany({
    where: { deletedAt: null },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    include: { reporter: { select: { id: true, name: true, email: true } } },
    take,
  });
}

export async function createAppIssue(
  user: SessionUser,
  input: { title: string; body: string; pageOrTab?: string },
) {
  assertCoordinator(user);
  const title = input.title.trim();
  const body = input.body.trim();
  if (!title || !body) {
    throw new DomainError("VALIDATION", "Title and details are required");
  }
  const issue = await prisma.appIssueReport.create({
    data: {
      reporterId: user.id,
      title,
      body,
      pageOrTab: (input.pageOrTab ?? "").trim(),
    },
  });
  await writeAudit({
    actorId: user.id,
    action: "APP_ISSUE_CREATED",
    entityType: "AppIssueReport",
    entityId: issue.id,
    after: { title: issue.title, pageOrTab: issue.pageOrTab },
  });
  return issue;
}

export async function updateAppIssueStatus(
  user: SessionUser,
  id: string,
  status: AppIssueStatus,
) {
  assertCoordinator(user);
  const existing = await prisma.appIssueReport.findFirst({
    where: { id, deletedAt: null },
  });
  if (!existing) throw new DomainError("NOT_FOUND", "Issue not found");
  const issue = await prisma.appIssueReport.update({
    where: { id },
    data: { status },
  });
  await writeAudit({
    actorId: user.id,
    action: "APP_ISSUE_STATUS",
    entityType: "AppIssueReport",
    entityId: issue.id,
    before: { status: existing.status },
    after: { status: issue.status },
  });
  return issue;
}
