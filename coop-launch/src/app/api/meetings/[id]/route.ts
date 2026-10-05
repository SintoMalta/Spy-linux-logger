import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withMutation } from "@/server/http";
import { canManageProgramme } from "@/server/auth/rbac";
import { AuthError } from "@/server/auth/session";

const schema = z.object({
  title: z.string().optional(),
  scheduledAt: z.string().optional(),
  location: z.string().optional().nullable(),
  notes: z.string().optional(),
  actions: z.string().optional(),
  softDelete: z.boolean().optional(),
});

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  return withMutation(request, async (user) => {
    if (!canManageProgramme(user)) throw new AuthError("FORBIDDEN", "Insufficient permissions");
    const { id } = await ctx.params;
    const body = schema.parse(await request.json());
    return prisma.meeting.update({
      where: { id },
      data: {
        title: body.title,
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
        location: body.location,
        notes: body.notes,
        actions: body.actions,
        deletedAt: body.softDelete ? new Date() : undefined,
      },
    });
  });
}
