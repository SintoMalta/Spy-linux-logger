import { prisma } from "@/lib/prisma";
import { AuthError, type SessionUser } from "@/server/auth/session";
import { canManageProgramme, canOverrideGate } from "@/server/auth/rbac";
import { writeAudit } from "@/server/audit";
import { DomainError } from "@/server/programme/task-service";

export function evaluateGateCriteria(
  criteria: { satisfied: boolean }[],
  hasOverride: boolean,
): { passed: boolean; blocked: boolean } {
  if (hasOverride) return { passed: true, blocked: false };
  const allSatisfied = criteria.length > 0 && criteria.every((c) => c.satisfied);
  return { passed: allSatisfied, blocked: !allSatisfied };
}

export async function getGateEvaluation(gateId: string) {
  const gate = await prisma.gate.findUnique({
    where: { id: gateId },
    include: {
      criteria: { orderBy: { order: "asc" } },
      overrides: { orderBy: { createdAt: "desc" }, take: 1 },
      stage: true,
    },
  });
  if (!gate) throw new DomainError("NOT_FOUND", "Gate not found");
  const evaluation = evaluateGateCriteria(
    gate.criteria,
    gate.overrides.length > 0,
  );
  return { gate, evaluation };
}

export async function setCriterionSatisfied(
  user: SessionUser,
  criterionId: string,
  satisfied: boolean,
  evidenceNote?: string,
) {
  if (!canManageProgramme(user)) {
    throw new AuthError("FORBIDDEN", "Insufficient permissions");
  }
  const criterion = await prisma.gateCriterion.update({
    where: { id: criterionId },
    data: { satisfied, evidenceNote },
  });
  await writeAudit({
    actorId: user.id,
    action: "GATE_CRITERION_UPDATED",
    entityType: "GateCriterion",
    entityId: criterionId,
    after: { satisfied, evidenceNote },
  });
  return criterion;
}

export async function overrideGate(
  user: SessionUser,
  gateId: string,
  reason: string,
) {
  if (!canOverrideGate(user)) {
    throw new AuthError("FORBIDDEN", "Cannot override gate");
  }
  if (!reason.trim()) {
    throw new DomainError("VALIDATION", "Override reason is required");
  }

  const override = await prisma.gateOverride.create({
    data: {
      gateId,
      authoriserId: user.id,
      reason: reason.trim(),
    },
  });

  await writeAudit({
    actorId: user.id,
    action: "GATE_OVERRIDE",
    entityType: "Gate",
    entityId: gateId,
    after: { reason: override.reason, overrideId: override.id },
  });

  const stage = await prisma.gate.findUnique({
    where: { id: gateId },
    select: { stageId: true },
  });
  if (stage) {
    await prisma.stage.update({
      where: { id: stage.stageId },
      data: { status: "COMPLETED" },
    });
  }

  return override;
}

/** Record go / conditional / no-go for the final review week (API path still named week9). */
export async function setWeek9Decision(
  user: SessionUser,
  decision: "GO" | "CONDITIONAL_GO" | "NO_GO",
) {
  if (!canManageProgramme(user)) {
    throw new AuthError("FORBIDDEN", "Insufficient permissions");
  }
  await writeAudit({
    actorId: user.id,
    action: "GO_NO_GO_DECISION",
    entityType: "Programme",
    entityId: "week-final",
    after: { decision },
  });
  return { decision, recorded: true as const };
}

export async function autoEvaluateGate(gateId: string) {
  return getGateEvaluation(gateId);
}

export async function markRegistrationSubmitted(user: SessionUser, verified: boolean) {
  if (!canManageProgramme(user)) {
    throw new AuthError("FORBIDDEN", "Insufficient permissions");
  }
  if (!verified) {
    throw new DomainError("VALIDATION", "Submission must be verified");
  }
  await writeAudit({
    actorId: user.id,
    action: "REGISTRATION_SUBMITTED",
    entityType: "Programme",
    entityId: "registration",
    after: { verified: true },
  });
  return { verified: true as const, recorded: true as const };
}

export async function advanceStageIfGatePassed(
  user: SessionUser,
  gateId: string,
) {
  if (!canManageProgramme(user)) {
    throw new AuthError("FORBIDDEN", "Insufficient permissions");
  }
  const { gate, evaluation } = await getGateEvaluation(gateId);
  if (!evaluation.passed) {
    throw new DomainError(
      "GATE_BLOCKED",
      "Gate criteria incomplete and no override recorded",
    );
  }
  await prisma.stage.update({
    where: { id: gate.stageId },
    data: { status: "COMPLETED" },
  });
  const next = await prisma.stage.findFirst({
    where: { weekNumber: gate.stage.weekNumber + 1, deletedAt: null },
  });
  if (next && next.status === "NOT_STARTED") {
    await prisma.stage.update({
      where: { id: next.id },
      data: { status: "IN_PROGRESS" },
    });
  }
  await writeAudit({
    actorId: user.id,
    action: "STAGE_ADVANCED",
    entityType: "Gate",
    entityId: gateId,
    after: { stageId: gate.stageId, nextStageId: next?.id ?? null },
  });
  return { gate, next };
}
