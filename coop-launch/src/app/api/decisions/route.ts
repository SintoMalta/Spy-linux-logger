import { z } from "zod";
import { withMutation, withSessionJson } from "@/server/http";
import { canManageProgramme } from "@/server/auth/rbac";
import { AuthError } from "@/server/auth/session";
import { createDecision } from "@/server/governance/decisions";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  meetingId: z.string().optional(),
});

export async function GET() {
  return withSessionJson(async (user) => {
    if (!canManageProgramme(user)) throw new AuthError("FORBIDDEN", "Insufficient permissions");
    return prisma.decision.findMany({ orderBy: { decidedAt: "desc" } });
  });
}

export async function POST(request: Request) {
  return withMutation(request, async (user) => {
    const body = schema.parse(await request.json());
    return createDecision(user, body);
  });
}
