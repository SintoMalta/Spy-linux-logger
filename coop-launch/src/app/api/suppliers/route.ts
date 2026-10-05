import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withMutation, withSessionJson } from "@/server/http";
import { canManageProgramme } from "@/server/auth/rbac";
import { AuthError } from "@/server/auth/session";
import { filterOffersForRole } from "@/server/economic/finance";

const schema = z.object({
  name: z.string().min(1),
  category: z.string().optional(),
  contact: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET() {
  return withSessionJson(async (user) => {
    if (!canManageProgramme(user)) throw new AuthError("FORBIDDEN", "Insufficient permissions");
    const suppliers = await prisma.supplier.findMany({
      where: { deletedAt: null },
      include: { offers: { where: { deletedAt: null } }, discussions: true },
    });
    return suppliers.map((s) => ({ ...s, offers: filterOffersForRole(s.offers, user) }));
  });
}

export async function POST(request: Request) {
  return withMutation(request, async (user) => {
    if (!canManageProgramme(user)) throw new AuthError("FORBIDDEN", "Insufficient permissions");
    const body = schema.parse(await request.json());
    return prisma.supplier.create({
      data: {
        name: body.name,
        category: body.category ?? "",
        contact: body.contact ?? "",
        notes: body.notes ?? "",
      },
    });
  });
}
