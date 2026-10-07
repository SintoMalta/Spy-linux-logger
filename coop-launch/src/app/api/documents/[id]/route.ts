import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withMutation } from "@/server/http";
import { canManageProgramme } from "@/server/auth/rbac";
import { AuthError } from "@/server/auth/session";
import { writeAudit } from "@/server/audit";

const schema = z.object({ softDelete: z.boolean().optional() });

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  return withMutation(request, async (user) => {
    if (!canManageProgramme(user)) throw new AuthError("FORBIDDEN", "Insufficient permissions");
    const { id } = await ctx.params;
    const body = schema.parse(await request.json());
    if (body.softDelete) {
      const doc = await prisma.document.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
      await writeAudit({ actorId: user.id, action: "DOCUMENT_SOFT_DELETE", entityType: "Document", entityId: id });
      return doc;
    }
    return prisma.document.findUniqueOrThrow({ where: { id } });
  });
}
