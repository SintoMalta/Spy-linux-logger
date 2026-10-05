import { z } from "zod";
import { withMutation, withSessionJson } from "@/server/http";
import { createFounderAction } from "@/server/programme/founder-actions";
import { prisma } from "@/lib/prisma";
import { canAccessFounderDashboard, canManageProgramme } from "@/server/auth/rbac";
import { AuthError } from "@/server/auth/session";

const schema = z.object({
  title: z.string().min(1),
  detail: z.string().optional(),
  kind: z
    .enum(["INTRODUCTION", "CONTACT", "ANSWER", "REVIEW_CANDIDATE", "REVIEW_FINDING", "ATTEND", "APPROVE", "OTHER"])
    .optional(),
  assigneeId: z.string(),
});

export async function GET() {
  return withSessionJson(async (user) => {
    if (!canAccessFounderDashboard(user)) throw new AuthError("FORBIDDEN", "Insufficient permissions");
    const where =
      user.role === "INDUSTRY_FOUNDER"
        ? { assigneeId: user.id, deletedAt: null }
        : { deletedAt: null };
    return prisma.founderActionRequest.findMany({ where, orderBy: { updatedAt: "desc" } });
  });
}

export async function POST(request: Request) {
  return withMutation(request, async (user) => {
    if (!canManageProgramme(user)) throw new AuthError("FORBIDDEN", "Insufficient permissions");
    const body = schema.parse(await request.json());
    return createFounderAction(user, body);
  });
}
