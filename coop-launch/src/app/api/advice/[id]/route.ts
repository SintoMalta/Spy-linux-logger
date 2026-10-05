import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withMutation } from "@/server/http";
import { canManageProgramme } from "@/server/auth/rbac";
import { AuthError } from "@/server/auth/session";

const schema = z.object({
  category: z.string().optional(),
  title: z.string().optional(),
  body: z.string().optional(),
  status: z.enum(["OPEN", "AWAITING_RESPONSE", "ANSWERED", "FOLLOW_UP_REQUIRED", "CLOSED"]).optional(),
  responseNotes: z.string().optional(),
  followUpDate: z.string().optional().nullable(),
  softDelete: z.boolean().optional(),
});

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  return withMutation(request, async (user) => {
    if (!canManageProgramme(user) && user.role !== "ADVISER") {
      throw new AuthError("FORBIDDEN", "Insufficient permissions");
    }
    const { id } = await ctx.params;
    const body = schema.parse(await request.json());
    return prisma.adviceItem.update({
      where: { id },
      data: {
        category: body.category,
        title: body.title,
        body: body.body,
        status: body.status,
        responseNotes: body.responseNotes,
        followUpDate: body.followUpDate === undefined ? undefined : body.followUpDate ? new Date(body.followUpDate) : null,
        deletedAt: body.softDelete ? new Date() : undefined,
      },
    });
  });
}
