import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withMutation, withSessionJson } from "@/server/http";
import { canManageProgramme } from "@/server/auth/rbac";
import { AuthError } from "@/server/auth/session";

const schema = z.object({
  title: z.string().min(1),
  scheduledAt: z.string(),
  location: z.string().optional().nullable(),
  notes: z.string().optional(),
  actions: z.string().optional(),
  attendeeUserIds: z.array(z.string()).optional(),
  attendeePersonIds: z.array(z.string()).optional(),
});

export async function GET() {
  return withSessionJson(async (user) => {
    if (!canManageProgramme(user)) throw new AuthError("FORBIDDEN", "Insufficient permissions");
    return prisma.meeting.findMany({
      where: { deletedAt: null },
      include: { attendees: true, decisions: true },
      orderBy: { scheduledAt: "desc" },
    });
  });
}

export async function POST(request: Request) {
  return withMutation(request, async (user) => {
    if (!canManageProgramme(user)) throw new AuthError("FORBIDDEN", "Insufficient permissions");
    const body = schema.parse(await request.json());
    return prisma.meeting.create({
      data: {
        title: body.title,
        scheduledAt: new Date(body.scheduledAt),
        location: body.location,
        notes: body.notes ?? "",
        actions: body.actions ?? "",
        attendees: {
          create: [
            ...(body.attendeeUserIds ?? []).map((userId) => ({ userId })),
            ...(body.attendeePersonIds ?? []).map((personId) => ({ personId })),
          ],
        },
      },
      include: { attendees: true },
    });
  });
}
