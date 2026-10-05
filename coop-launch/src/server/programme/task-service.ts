import { prisma } from "@/lib/prisma";
import { AuthError, type SessionUser } from "@/server/auth/session";
import { canManageProgramme } from "@/server/auth/rbac";
import { writeAudit } from "@/server/audit";
import type { TaskStatus } from "@prisma/client";

export class DomainError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "DomainError";
  }
}

export function allDodSatisfied(
  criteria: { satisfied: boolean; overridden: boolean }[],
): boolean {
  if (criteria.length === 0) return false;
  return criteria.every((c) => c.satisfied || c.overridden);
}

export async function updateTaskStatus(
  user: SessionUser,
  taskId: string,
  input: {
    status: TaskStatus;
    waitingOnPersonId?: string | null;
    waitingOnOrgId?: string | null;
    dateRequested?: string | null;
    followUpDate?: string | null;
  },
) {
  if (!canManageProgramme(user)) {
    throw new AuthError("FORBIDDEN", "Insufficient permissions");
  }
  if (input.status === "WAITING_EXTERNAL") {
    if (!input.waitingOnPersonId && !input.waitingOnOrgId) {
      throw new DomainError(
        "VALIDATION",
        "WAITING_EXTERNAL requires waitingOnPerson or waitingOnOrganisation",
      );
    }
  }
  const before = await prisma.task.findFirst({ where: { id: taskId, deletedAt: null } });
  if (!before) throw new DomainError("NOT_FOUND", "Task not found");

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: {
      status: input.status,
      waitingOnPersonId: input.waitingOnPersonId ?? null,
      waitingOnOrgId: input.waitingOnOrgId ?? null,
      dateRequested: input.dateRequested ? new Date(input.dateRequested) : null,
      followUpDate: input.followUpDate ? new Date(input.followUpDate) : null,
    },
  });
  await writeAudit({
    actorId: user.id,
    action: "TASK_STATUS",
    entityType: "Task",
    entityId: taskId,
    before: { status: before.status },
    after: { status: updated.status },
  });
  return updated;
}

export async function markTaskAchieved(
  user: SessionUser,
  taskId: string,
  options?: { overrideReason?: string },
) {
  if (!canManageProgramme(user)) {
    throw new AuthError("FORBIDDEN", "Only coordinators can achieve tasks");
  }

  const task = await prisma.task.findFirst({
    where: { id: taskId, deletedAt: null },
    include: {
      dodCriteria: true,
      dependsOn: { include: { dependsOn: true } },
    },
  });
  if (!task) throw new DomainError("NOT_FOUND", "Task not found");

  for (const dep of task.dependsOn) {
    if (dep.dependsOn.status !== "ACHIEVED") {
      throw new DomainError(
        "DEPENDENCY",
        `Blocked by dependency: ${dep.dependsOn.title}`,
      );
    }
  }

  const dodOk = allDodSatisfied(task.dodCriteria);
  if (!dodOk) {
    if (!options?.overrideReason) {
      throw new DomainError(
        "DOD_INCOMPLETE",
        "Definition of Done is not met; provide an authorised override reason",
      );
    }
    await prisma.definitionOfDoneCriterion.updateMany({
      where: { taskId, satisfied: false, overridden: false },
      data: { overridden: true, overrideReason: options.overrideReason },
    });
  }

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: { status: "ACHIEVED", achievedAt: new Date() },
  });

  await writeAudit({
    actorId: user.id,
    action: dodOk ? "TASK_ACHIEVED" : "TASK_ACHIEVED_OVERRIDE",
    entityType: "Task",
    entityId: taskId,
    before: { status: task.status },
    after: {
      status: updated.status,
      overrideReason: options?.overrideReason ?? null,
    },
  });

  return updated;
}

export async function setDodSatisfied(
  user: SessionUser,
  criterionId: string,
  satisfied: boolean,
) {
  if (!canManageProgramme(user)) {
    throw new AuthError("FORBIDDEN", "Insufficient permissions");
  }
  const criterion = await prisma.definitionOfDoneCriterion.update({
    where: { id: criterionId },
    data: {
      satisfied,
      overridden: satisfied ? false : undefined,
      overrideReason: satisfied ? null : undefined,
    },
  });
  await writeAudit({
    actorId: user.id,
    action: "DOD_UPDATED",
    entityType: "DefinitionOfDoneCriterion",
    entityId: criterionId,
    after: { satisfied },
  });
  return criterion;
}

export async function addTaskNote(user: SessionUser, taskId: string, body: string) {
  if (!canManageProgramme(user)) {
    throw new AuthError("FORBIDDEN", "Insufficient permissions");
  }
  return prisma.taskNote.create({ data: { taskId, body } });
}
