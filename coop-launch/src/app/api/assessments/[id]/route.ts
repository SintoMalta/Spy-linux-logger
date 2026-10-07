import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withMutation } from "@/server/http";
import { canAccessFounderDashboard, canManageProgramme } from "@/server/auth/rbac";
import { AuthError } from "@/server/auth/session";
import { writeAudit } from "@/server/audit";

const schema = z.object({
  title: z.string().optional(),
  positiveNotes: z.string().optional(),
  redFlagPrompts: z.string().optional(),
  evidenceNotes: z.string().optional(),
  status: z.string().optional(),
  founderReviewed: z.boolean().optional(),
  founderReviewNote: z.string().optional(),
});

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  return withMutation(request, async (user) => {
    const { id } = await ctx.params;
    const body = schema.parse(await request.json());
    if (body.founderReviewed !== undefined || body.founderReviewNote !== undefined) {
      if (!canAccessFounderDashboard(user)) throw new AuthError("FORBIDDEN", "Insufficient permissions");
    } else if (!canManageProgramme(user)) {
      throw new AuthError("FORBIDDEN", "Insufficient permissions");
    }
    const item = await prisma.founderAssessment.update({
      where: { id },
      data: body,
    });
    await writeAudit({ actorId: user.id, action: "ASSESSMENT_UPDATE", entityType: "FounderAssessment", entityId: id });
    return item;
  });
}
