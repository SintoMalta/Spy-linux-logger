import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withMutation, withSessionJson } from "@/server/http";
import { canManageProgramme } from "@/server/auth/rbac";
import { AuthError } from "@/server/auth/session";

const schema = z.object({
  title: z.string().min(1),
  probability: z.number().int().min(1).max(5),
  impact: z.number().int().min(1).max(5),
  mitigation: z.string().optional(),
  trigger: z.string().optional(),
  status: z.enum(["OPEN", "MITIGATING", "CLOSED", "ACCEPTED"]).optional(),
  ownerId: z.string().optional().nullable(),
});

export async function GET() {
  return withSessionJson(async (user) => {
    if (!canManageProgramme(user)) throw new AuthError("FORBIDDEN", "Insufficient permissions");
    return prisma.risk.findMany({ where: { deletedAt: null }, orderBy: { rating: "desc" } });
  });
}

export async function POST(request: Request) {
  return withMutation(request, async (user) => {
    if (!canManageProgramme(user)) throw new AuthError("FORBIDDEN", "Insufficient permissions");
    const body = schema.parse(await request.json());
    return prisma.risk.create({
      data: {
        title: body.title,
        probability: body.probability,
        impact: body.impact,
        rating: body.probability * body.impact,
        mitigation: body.mitigation ?? "",
        trigger: body.trigger ?? "",
        status: body.status ?? "OPEN",
        ownerId: body.ownerId ?? user.id,
      },
    });
  });
}
