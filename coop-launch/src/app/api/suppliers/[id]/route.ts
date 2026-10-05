import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withMutation } from "@/server/http";
import { canManageProgramme } from "@/server/auth/rbac";
import { AuthError } from "@/server/auth/session";

const schema = z.object({
  name: z.string().optional(),
  category: z.string().optional(),
  contact: z.string().optional(),
  notes: z.string().optional(),
  softDelete: z.boolean().optional(),
  discussion: z.string().optional(),
  offer: z
    .object({
      description: z.string(),
      unitPrice: z.number().optional(),
      discountPct: z.number().optional(),
      rebateNotes: z.string().optional(),
      terms: z.string().optional(),
      validUntil: z.string().optional().nullable(),
      assumptionConfidence: z.enum(["VERIFIED", "ESTIMATE", "ASSUMPTION"]),
      confidentialMemberScope: z.string().optional().nullable(),
    })
    .optional(),
});

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  return withMutation(request, async (user) => {
    if (!canManageProgramme(user)) throw new AuthError("FORBIDDEN", "Insufficient permissions");
    const { id } = await ctx.params;
    const body = schema.parse(await request.json());
    if (body.discussion) {
      await prisma.supplierDiscussion.create({
        data: { supplierId: id, userId: user.id, summary: body.discussion },
      });
    }
    if (body.offer) {
      await prisma.supplierOffer.create({
        data: {
          supplierId: id,
          description: body.offer.description,
          unitPrice: body.offer.unitPrice,
          discountPct: body.offer.discountPct,
          rebateNotes: body.offer.rebateNotes ?? "",
          terms: body.offer.terms ?? "",
          validUntil: body.offer.validUntil ? new Date(body.offer.validUntil) : null,
          assumptionConfidence: body.offer.assumptionConfidence,
          confidentialMemberScope: body.offer.confidentialMemberScope ?? null,
        },
      });
    }
    return prisma.supplier.update({
      where: { id },
      data: {
        name: body.name,
        category: body.category,
        contact: body.contact,
        notes: body.notes,
        deletedAt: body.softDelete ? new Date() : undefined,
      },
      include: { offers: true, discussions: true },
    });
  });
}
