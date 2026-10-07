import { prisma } from "@/lib/prisma";
import { AuthError, type SessionUser } from "@/server/auth/session";
import { canAccessFounderDashboard } from "@/server/auth/rbac";
import { writeAudit } from "@/server/audit";
import type { FounderActionType } from "@prisma/client";
import { DomainError } from "@/server/programme/task-service";

export async function respondToFounderAction(
  user: SessionUser,
  actionId: string,
  response: { action: FounderActionType; comment?: string },
) {
  if (!canAccessFounderDashboard(user)) {
    throw new AuthError("FORBIDDEN", "Cannot respond to founder actions");
  }

  const existing = await prisma.founderActionRequest.findFirst({
    where: { id: actionId, deletedAt: null },
  });
  if (!existing) throw new DomainError("NOT_FOUND", "Action not found");

  if (
    user.role === "INDUSTRY_FOUNDER" &&
    existing.assigneeId !== user.id
  ) {
    throw new AuthError("FORBIDDEN", "Not your action request");
  }

  let status = existing.status;
  if (response.action === "DONE") status = "DONE";
  if (response.action === "DEFER") status = "DEFERRED";
  if (response.action === "COMMENT" || response.action === "CALL_NESLI") {
    status = "OPEN";
  }

  const updated = await prisma.founderActionRequest.update({
    where: { id: actionId },
    data: {
      status,
      lastAction: response.action,
      comment: response.comment ?? existing.comment,
    },
  });

  await writeAudit({
    actorId: user.id,
    action: "FOUNDER_ACTION_RESPONSE",
    entityType: "FounderActionRequest",
    entityId: actionId,
    after: { lastAction: response.action, status },
  });

  return updated;
}
