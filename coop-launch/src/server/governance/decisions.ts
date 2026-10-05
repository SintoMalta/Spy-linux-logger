import { prisma } from "@/lib/prisma";
import { AuthError, type SessionUser } from "@/server/auth/session";
import { canCreateDecision } from "@/server/auth/rbac";
import { writeAudit } from "@/server/audit";
import { DomainError } from "@/server/programme/task-service";

export async function createDecision(
  user: SessionUser,
  input: { title: string; body: string; meetingId?: string },
) {
  if (!canCreateDecision(user)) {
    throw new AuthError("FORBIDDEN", "Cannot create decisions");
  }
  const decision = await prisma.decision.create({
    data: {
      title: input.title,
      body: input.body,
      meetingId: input.meetingId,
      decidedById: user.id,
      status: "DRAFT",
    },
  });
  await writeAudit({
    actorId: user.id,
    action: "DECISION_CREATED",
    entityType: "Decision",
    entityId: decision.id,
    after: { title: decision.title, status: decision.status },
  });
  return decision;
}

export async function finaliseDecision(user: SessionUser, decisionId: string) {
  if (!canCreateDecision(user)) {
    throw new AuthError("FORBIDDEN", "Cannot finalise decisions");
  }
  const existing = await prisma.decision.findUnique({ where: { id: decisionId } });
  if (!existing) throw new DomainError("NOT_FOUND", "Decision not found");
  if (existing.status === "FINAL") {
    throw new DomainError("IMMUTABLE", "Decision already finalised");
  }
  const decision = await prisma.decision.update({
    where: { id: decisionId },
    data: { status: "FINAL", decidedAt: new Date() },
  });
  await writeAudit({
    actorId: user.id,
    action: "DECISION_FINALISED",
    entityType: "Decision",
    entityId: decision.id,
  });
  return decision;
}

export async function updateDecisionForbidden(): Promise<never> {
  throw new DomainError(
    "IMMUTABLE",
    "Final decisions are immutable and cannot be updated",
  );
}

export async function deleteDecisionForbidden(): Promise<never> {
  throw new DomainError(
    "IMMUTABLE",
    "Decisions cannot be deleted",
  );
}

/** Exact §31–32 template bodies — do not alter tone. */
export const TEMPLATE_BODIES = {
  SEC31_INTRO:
    "We are exploring the feasibility of a cooperative purchasing arrangement in Malta. Participation at this stage is provisional and does not create any obligation to join, purchase, or register. Any next steps will be based on evidence gathered during the programme.",
  SEC32_OUTREACH:
    "This message invites a short conversation about shared procurement challenges. We will not share your confidential commercial figures with other participants. Findings may be summarised in anonymised form. Registration of any cooperative, if pursued, remains subject to legal requirements and member decisions.",
} as const;
