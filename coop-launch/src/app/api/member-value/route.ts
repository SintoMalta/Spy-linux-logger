import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withMutation, withSessionJson } from "@/server/http";
import { canManageProgramme } from "@/server/auth/rbac";
import { AuthError } from "@/server/auth/session";
import { calculateMemberValue } from "@/server/economic/finance";

const schema = z.object({
  memberLabel: z.string().min(1),
  annualSpend: z.number(),
  coopDiscountPct: z.number(),
  membershipFee: z.number(),
  hoursSaved: z.number(),
  hourlyValue: z.number(),
});

export async function GET() {
  return withSessionJson(async (user) => {
    if (!canManageProgramme(user)) throw new AuthError("FORBIDDEN", "Insufficient permissions");
    return prisma.memberValueStatement.findMany({ orderBy: { calculatedAt: "desc" }, take: 20 });
  });
}

export async function POST(request: Request) {
  return withMutation(request, async (user) => {
    if (!canManageProgramme(user)) throw new AuthError("FORBIDDEN", "Insufficient permissions");
    const body = schema.parse(await request.json());
    const result = calculateMemberValue(body);
    return prisma.memberValueStatement.create({
      data: {
        memberLabel: body.memberLabel,
        inputsJson: body,
        resultJson: result,
        createdById: user.id,
      },
    });
  });
}
