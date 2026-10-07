import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withMutation } from "@/server/http";
import { canManageProgramme } from "@/server/auth/rbac";
import { AuthError } from "@/server/auth/session";

const schema = z.object({
  title: z.string().optional(),
  probability: z.number().int().min(1).max(5).optional(),
  impact: z.number().int().min(1).max(5).optional(),
  mitigation: z.string().optional(),
  trigger: z.string().optional(),
  status: z.enum(["OPEN", "MITIGATING", "CLOSED", "ACCEPTED"]).optional(),
  softDelete: z.boolean().optional(),
});

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  return withMutation(request, async (user) => {
    if (!canManageProgramme(user)) throw new AuthError("FORBIDDEN", "Insufficient permissions");
    const { id } = await ctx.params;
    const body = schema.parse(await request.json());
    const existing = await prisma.risk.findUniqueOrThrow({ where: { id } });
    const probability = body.probability ?? existing.probability;
    const impact = body.impact ?? existing.impact;
    return prisma.risk.update({
      where: { id },
      data: {
        title: body.title,
        probability,
        impact,
        rating: probability * impact,
        mitigation: body.mitigation,
        trigger: body.trigger,
        status: body.status,
        deletedAt: body.softDelete ? new Date() : undefined,
      },
    });
  });
}
