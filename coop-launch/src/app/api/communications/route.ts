import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withMutation } from "@/server/http";
import { canWriteCrm } from "@/server/auth/rbac";
import { AuthError } from "@/server/auth/session";

const schema = z.object({
  personId: z.string().optional().nullable(),
  organisationId: z.string().optional().nullable(),
  channel: z.string().min(1),
  summary: z.string().min(1),
  occurredAt: z.string().optional(),
});

export async function POST(request: Request) {
  return withMutation(request, async (user) => {
    if (!canWriteCrm(user)) throw new AuthError("FORBIDDEN", "Cannot write CRM");
    const body = schema.parse(await request.json());
    return prisma.communication.create({
      data: {
        personId: body.personId ?? null,
        organisationId: body.organisationId ?? null,
        channel: body.channel,
        summary: body.summary,
        occurredAt: body.occurredAt ? new Date(body.occurredAt) : new Date(),
        userId: user.id,
      },
    });
  });
}
