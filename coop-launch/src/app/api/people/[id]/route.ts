import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withMutation } from "@/server/http";
import { canWriteCrm } from "@/server/auth/rbac";
import { AuthError } from "@/server/auth/session";
import { writeAudit } from "@/server/audit";
import { DomainError } from "@/server/programme/task-service";

const schema = z.object({
  name: z.string().min(1).optional(),
  organisationId: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  roleTitle: z.string().optional(),
  trade: z.string().optional(),
  status: z.string().optional(),
  notes: z.string().optional(),
  nextAction: z.string().optional(),
  followUpDate: z.string().optional().nullable(),
  potentialFounder: z.boolean().optional(),
  softDelete: z.boolean().optional(),
});

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  return withMutation(request, async (user) => {
    if (!canWriteCrm(user)) throw new AuthError("FORBIDDEN", "Cannot write CRM");
    const { id } = await ctx.params;
    const body = schema.parse(await request.json());
    const existing = await prisma.person.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new DomainError("NOT_FOUND", "Person not found");
    const person = await prisma.person.update({
      where: { id },
      data: {
        name: body.name,
        organisationId: body.organisationId,
        email: body.email,
        phone: body.phone,
        roleTitle: body.roleTitle,
        trade: body.trade,
        status: body.status as never,
        notes: body.notes,
        nextAction: body.nextAction,
        followUpDate: body.followUpDate === undefined ? undefined : body.followUpDate ? new Date(body.followUpDate) : null,
        potentialFounder: body.potentialFounder,
        deletedAt: body.softDelete ? new Date() : undefined,
      },
    });
    await writeAudit({ actorId: user.id, action: body.softDelete ? "PERSON_SOFT_DELETE" : "PERSON_UPDATE", entityType: "Person", entityId: id });
    return person;
  });
}
