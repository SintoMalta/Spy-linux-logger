import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function writeAudit(params: {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  before?: Prisma.InputJsonValue;
  after?: Prisma.InputJsonValue;
}) {
  return prisma.auditLog.create({
    data: {
      actorId: params.actorId ?? null,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      beforeJson: params.before,
      afterJson: params.after,
    },
  });
}
