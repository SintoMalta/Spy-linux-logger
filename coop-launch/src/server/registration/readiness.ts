import type { RegistrationPriority } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AuthError, type SessionUser } from "@/server/auth/session";
import { canManageProgramme } from "@/server/auth/rbac";
import { writeAudit } from "@/server/audit";
import { DomainError } from "@/server/programme/task-service";

export type ReadinessResult = {
  percent: number;
  blocked: boolean;
  blockers: { code: string; title: string }[];
  total: number;
  completed: number;
  mandatoryTotal: number;
  mandatoryCompleted: number;
};

export function computeReadinessPercent(input: {
  items: {
    priority: RegistrationPriority;
    completed: boolean;
    evidenceDocumentId: string | null;
    code: string;
    title: string;
  }[];
}): ReadinessResult {
  const total = input.items.length;
  const completed = input.items.filter((i) => i.completed).length;
  const mandatory = input.items.filter((i) => i.priority === "MANDATORY");
  const blockers = mandatory
    .filter((i) => !i.completed || !i.evidenceDocumentId)
    .map((i) => ({ code: i.code, title: i.title }));
  const mandatoryCompleted = mandatory.length - blockers.length;
  const raw = total === 0 ? 0 : Math.round((completed / total) * 100);
  const blocked = blockers.length > 0;
  const percent = blocked ? Math.min(raw, 99) : raw;
  return {
    percent,
    blocked,
    blockers,
    total,
    completed,
    mandatoryTotal: mandatory.length,
    mandatoryCompleted,
  };
}

export async function getRegistrationReadiness(): Promise<ReadinessResult> {
  const items = await prisma.registrationRequirement.findMany({
    orderBy: { code: "asc" },
  });
  return computeReadinessPercent({ items });
}

export async function updateRegistrationRequirement(
  user: SessionUser,
  id: string,
  data: {
    completed?: boolean;
    notes?: string;
    evidenceDocumentId?: string | null;
    dueDate?: string | null;
  },
) {
  if (!canManageProgramme(user)) {
    throw new AuthError("FORBIDDEN", "Insufficient permissions");
  }
  const before = await prisma.registrationRequirement.findUnique({ where: { id } });
  if (!before) throw new DomainError("NOT_FOUND", "Requirement not found");

  // Week 9 NO_GO blocks registration completion work
  const week9 = await prisma.programmeFlag.findUnique({
    where: { key: "WEEK9_DECISION" },
  });
  if (week9?.value === "NO_GO" && data.completed) {
    throw new DomainError(
      "NO_GO",
      "Week 9 NO_GO blocks registration checklist completion",
    );
  }

  const updated = await prisma.registrationRequirement.update({
    where: { id },
    data: {
      completed: data.completed,
      notes: data.notes,
      evidenceDocumentId: data.evidenceDocumentId,
      dueDate: data.dueDate === undefined ? undefined : data.dueDate ? new Date(data.dueDate) : null,
      completedAt: data.completed ? new Date() : data.completed === false ? null : undefined,
    },
  });
  await writeAudit({
    actorId: user.id,
    action: "REGISTRATION_UPDATED",
    entityType: "RegistrationRequirement",
    entityId: id,
    before: { completed: before.completed },
    after: { completed: updated.completed, evidenceDocumentId: updated.evidenceDocumentId },
  });
  return updated;
}
