import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withMutation } from "@/server/http";
import { canWriteCrm } from "@/server/auth/rbac";
import { AuthError } from "@/server/auth/session";
import { writeAudit } from "@/server/audit";
import { DomainError } from "@/server/programme/task-service";

const schema = z.object({
  name: z.string().min(1).optional(),
  trade: z.string().optional(),
  status: z.string().optional(),
  notes: z.string().optional(),
  nextAction: z.string().optional(),
  followUpDate: z.string().optional().nullable(),
  potentialFounder: z.boolean().optional(),
  locality: z.string().optional(),
  softDelete: z.boolean().optional(),
});

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  return withMutation(request, async (user) => {
    if (!canWriteCrm(user)) throw new AuthError("FORBIDDEN", "Cannot write CRM");
    const { id } = await ctx.params;
    const body = schema.parse(await request.json());
    const existing = await prisma.organisation.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new DomainError("NOT_FOUND", "Organisation not found");
    const org = await prisma.organisation.update({
      where: { id },
      data: {
        name: body.name,
        trade: body.trade,
        status: body.status as never,
        notes: body.notes,
        nextAction: body.nextAction,
        followUpDate: body.followUpDate === undefined ? undefined : body.followUpDate ? new Date(body.followUpDate) : null,
        potentialFounder: body.potentialFounder,
        locality: body.locality,
        deletedAt: body.softDelete ? new Date() : undefined,
      },
    });
    await writeAudit({ actorId: user.id, action: body.softDelete ? "ORG_SOFT_DELETE" : "ORG_UPDATE", entityType: "Organisation", entityId: id });
    return org;
  });
}
