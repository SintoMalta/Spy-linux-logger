import { prisma } from "@/lib/prisma";
import { AuthError, type SessionUser } from "@/server/auth/session";
import { canManageProgramme, canOverrideGate } from "@/server/auth/rbac";
import { writeAudit } from "@/server/audit";
import { DomainError } from "@/server/programme/task-service";
import {
  collectMetrics,
  evaluateCriterionAgainstMetrics,
} from "@/server/programme/metrics";

export function evaluateGateCriteria(
  criteria: { satisfied: boolean }[],
  hasOverride: boolean,
): { passed: boolean; blocked: boolean } {
  if (hasOverride) return { passed: true, blocked: false };
  const allSatisfied = criteria.length > 0 && criteria.every((c) => c.satisfied);
  return { passed: allSatisfied, blocked: !allSatisfied };
}

export async function autoEvaluateGate(gateId: string) {
  const gate = await prisma.gate.findUnique({
    where: { id: gateId },
    include: {
      criteria: { orderBy: { order: "asc" } },
      reviews: { orderBy: { reviewedAt: "desc" }, take: 1 },
      overrides: { orderBy: { createdAt: "desc" }, take: 1 },
      stage: true,
    },
  });
  if (!gate) throw new DomainError("NOT_FOUND", "Gate not found");

  const metrics = await collectMetrics();

  for (const criterion of gate.criteria) {
    let hasDocument = false;
    if (criterion.type === "REQUIRED_DOCUMENT") {
      const doc = await prisma.document.findFirst({
        where: {
          deletedAt: null,
          OR: [
            { linkedType: "Gate", linkedId: gate.id },
            { linkedType: "GateCriterion", linkedId: criterion.id },
            criterion.code
              ? { linkedType: "GateCriterionCode", linkedId: criterion.code }
              : undefined,
          ].filter(Boolean) as { linkedType: string; linkedId: string }[],
        },
      });
      hasDocument = Boolean(doc);
    }

    const evaluated = evaluateCriterionAgainstMetrics(criterion, metrics, {
      hasDocument,
      hasReview: gate.reviews.length > 0 && gate.reviews[0].passed,
      hasExternalAnswer: criterion.satisfied,
    });

    // MANUAL_APPROVAL and BOOLEAN without metric keep stored satisfied unless auto metric applies
    if (
      criterion.type === "MANUAL_APPROVAL" ||
      (criterion.type === "BOOLEAN" && criterion.metricKey === "NONE")
    ) {
      continue;
    }

    if (
      criterion.satisfied !== evaluated.satisfied ||
      criterion.evidenceNote !== evaluated.evidenceNote
    ) {
      await prisma.gateCriterion.update({
        where: { id: criterion.id },
        data: {
          satisfied: evaluated.satisfied,
          evidenceNote: evaluated.evidenceNote,
        },
      });
    }
  }

  return getGateEvaluation(gateId);
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
    after: {
      reason: override.reason,
      overrideId: override.id,
      authoriserId: user.id,
      createdAt: override.createdAt.toISOString(),
    },
  });

  return override;
}

export async function applyWeekOutcomes(user: SessionUser, weekNumber: number) {
  if (!canManageProgramme(user)) {
    throw new AuthError("FORBIDDEN", "Insufficient permissions");
  }

  const stageFull = await prisma.stage.findUnique({
    where: { weekNumber },
    include: { gate: true },
  });
  if (!stageFull?.gate) throw new DomainError("NOT_FOUND", "Stage/gate missing");

  const { evaluation } = await autoEvaluateGate(stageFull.gate.id);
  const metrics = await collectMetrics();

  if (weekNumber === 4) {
    if (metrics.problemTagCount < 3) {
      await prisma.stage.update({
        where: { id: stageFull.id },
        data: {
          status: "REDESIGN",
          outcomeNote: "Fewer than 3 distinct problems — REDESIGN / NO-GO path",
        },
      });
      return { status: "REDESIGN" as const, metrics };
    }
  }

  if (weekNumber === 9) {
    const flag = await prisma.programmeFlag.findUnique({
      where: { key: "WEEK9_DECISION" },
    });
    const decision = flag?.value ?? "NO_GO";
    if (decision === "NO_GO") {
      await prisma.stage.update({
        where: { id: stageFull.id },
        data: { status: "NO_GO", outcomeNote: "Week 9 NO_GO blocks registration" },
      });
      return { status: "NO_GO" as const, metrics };
    }
    await prisma.stage.update({
      where: { id: stageFull.id },
      data: {
        status: decision === "GO" ? "GO" : "CONDITIONAL_GO",
        outcomeNote: `Week 9 ${decision}`,
      },
    });
    return { status: decision as "GO" | "CONDITIONAL_GO", metrics };
  }

  if (weekNumber === 12) {
    const submitted = await prisma.programmeFlag.findUnique({
      where: { key: "REGISTRATION_SUBMITTED" },
    });
    if (submitted?.value === "true") {
      await prisma.stage.update({
        where: { id: stageFull.id },
        data: {
          status: "REGISTRATION_SUBMITTED",
          outcomeNote: "Verified submission recorded",
        },
      });
      return { status: "REGISTRATION_SUBMITTED" as const, metrics };
    }
    if (evaluation.passed) {
      await prisma.stage.update({
        where: { id: stageFull.id },
        data: {
          status: "REGISTRATION_READY",
          outcomeNote: "Ready — submission not yet verified",
        },
      });
      return { status: "REGISTRATION_READY" as const, metrics };
    }
  }

  if (evaluation.passed) {
    await prisma.stage.update({
      where: { id: stageFull.id },
      data: { status: "COMPLETED" },
    });
  }

  return { status: stageFull.status, metrics, evaluation };
}

export async function advanceStageIfGatePassed(
  user: SessionUser,
  gateId: string,
) {
  if (!canManageProgramme(user)) {
    throw new AuthError("FORBIDDEN", "Insufficient permissions");
  }
  await autoEvaluateGate(gateId);
  const { gate, evaluation } = await getGateEvaluation(gateId);
  if (!evaluation.passed) {
    throw new DomainError(
      "GATE_BLOCKED",
      "Gate criteria incomplete and no override recorded",
    );
  }

  // Week 9 NO_GO must not advance into registration work
  if (gate.stage.weekNumber === 9) {
    const flag = await prisma.programmeFlag.findUnique({
      where: { key: "WEEK9_DECISION" },
    });
    if (!flag || flag.value === "NO_GO") {
      throw new DomainError(
        "NO_GO",
        "Week 9 NO_GO blocks progression into registration",
      );
    }
  }

  // Week 12 never auto-infers REGISTRATION_SUBMITTED
  if (gate.stage.weekNumber === 12) {
    await prisma.stage.update({
      where: { id: gate.stageId },
      data: { status: "REGISTRATION_READY" },
    });
    await writeAudit({
      actorId: user.id,
      action: "STAGE_REGISTRATION_READY",
      entityType: "Gate",
      entityId: gateId,
    });
    return { gate, next: null };
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

export async function setWeek9Decision(
  user: SessionUser,
  decision: "GO" | "CONDITIONAL_GO" | "NO_GO",
) {
  if (!canManageProgramme(user)) {
    throw new AuthError("FORBIDDEN", "Insufficient permissions");
  }
  const flag = await prisma.programmeFlag.upsert({
    where: { key: "WEEK9_DECISION" },
    update: { value: decision },
    create: { key: "WEEK9_DECISION", value: decision },
  });
  await writeAudit({
    actorId: user.id,
    action: "WEEK9_DECISION",
    entityType: "ProgrammeFlag",
    entityId: flag.id,
    after: { decision },
  });
  return flag;
}

export async function markRegistrationSubmitted(
  user: SessionUser,
  verified: boolean,
) {
  if (!canManageProgramme(user)) {
    throw new AuthError("FORBIDDEN", "Insufficient permissions");
  }
  if (!verified) {
    throw new DomainError(
      "VALIDATION",
      "Registration submission must be explicitly verified — never auto-inferred",
    );
  }
  const flag = await prisma.programmeFlag.upsert({
    where: { key: "REGISTRATION_SUBMITTED" },
    update: { value: "true" },
    create: { key: "REGISTRATION_SUBMITTED", value: "true" },
  });
  const week12 = await prisma.stage.findUnique({ where: { weekNumber: 12 } });
  if (week12) {
    await prisma.stage.update({
      where: { id: week12.id },
      data: { status: "REGISTRATION_SUBMITTED" },
    });
  }
  await writeAudit({
    actorId: user.id,
    action: "REGISTRATION_SUBMITTED_VERIFIED",
    entityType: "ProgrammeFlag",
    entityId: flag.id,
  });
  return flag;
}
