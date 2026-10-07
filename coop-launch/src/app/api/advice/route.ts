import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withMutation, withSessionJson } from "@/server/http";
import { canManageProgramme } from "@/server/auth/rbac";
import { AuthError } from "@/server/auth/session";

const schema = z.object({
  category: z.string().min(1),
  title: z.string().min(1),
  body: z.string().min(1),
  status: z.enum(["OPEN", "IN_PROGRESS", "ACCEPTED", "DECLINED", "DEFERRED"]).optional(),
  adviserId: z.string().optional().nullable(),
});

export async function GET() {
  return withSessionJson(async (user) => {
    if (!canManageProgramme(user) && user.role !== "ADVISER") {
      throw new AuthError("FORBIDDEN", "Insufficient permissions");
    }
    return prisma.adviceItem.findMany({ where: { deletedAt: null }, orderBy: { updatedAt: "desc" } });
  });
}

export async function POST(request: Request) {
  return withMutation(request, async (user) => {
    if (!canManageProgramme(user)) throw new AuthError("FORBIDDEN", "Insufficient permissions");
    const body = schema.parse(await request.json());
    return prisma.adviceItem.create({
      data: {
        category: body.category,
        title: body.title,
        body: body.body,
        status: body.status ?? "OPEN",
        adviserId: body.adviserId ?? null,
      },
    });
  });
}
