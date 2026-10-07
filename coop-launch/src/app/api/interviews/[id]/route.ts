import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withMutation } from "@/server/http";
import { canManageProgramme } from "@/server/auth/rbac";
import { AuthError } from "@/server/auth/session";
import { writeAudit } from "@/server/audit";
import { DomainError } from "@/server/programme/task-service";

const schema = z.object({
  notes: z.string().optional(),
  status: z.enum(["DRAFT", "COMPLETED"]).optional(),
});

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  return withMutation(request, async (user) => {
    if (!canManageProgramme(user)) throw new AuthError("FORBIDDEN", "Insufficient permissions");
    const { id } = await ctx.params;
    const body = schema.parse(await request.json());
    const existing = await prisma.interview.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new DomainError("NOT_FOUND", "Interview not found");
    const updated = await prisma.interview.update({
      where: { id },
      data: { notes: body.notes, status: body.status },
    });
    await writeAudit({ actorId: user.id, action: "INTERVIEW_UPDATE", entityType: "Interview", entityId: id, after: body });
    return updated;
  });
}
