import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withMutation, withSessionJson } from "@/server/http";
import { canManageProgramme, canWriteCrm } from "@/server/auth/rbac";
import { AuthError } from "@/server/auth/session";
import { writeAudit } from "@/server/audit";
import { crmFollowUpWrite } from "@/server/crm/follow-up";

const schema = z.object({
  name: z.string().min(1),
  trade: z.string().optional(),
  status: z.string().optional(),
  notes: z.string().optional(),
  nextAction: z.string().optional(),
  followUpDate: z.string().optional().nullable(),
  potentialFounder: z.boolean().optional(),
  locality: z.string().optional(),
});

export async function GET() {
  return withSessionJson(async (user) => {
    if (!canManageProgramme(user) && user.role !== "INDUSTRY_FOUNDER") {
      throw new AuthError("FORBIDDEN", "Insufficient permissions");
    }
    return prisma.organisation.findMany({
      where: { deletedAt: null },
      include: { people: { where: { deletedAt: null } } },
      orderBy: { name: "asc" },
    });
  });
}

export async function POST(request: Request) {
  return withMutation(request, async (user) => {
    if (!canWriteCrm(user)) throw new AuthError("FORBIDDEN", "Cannot write CRM");
    const body = schema.parse(await request.json());
    const org = await prisma.organisation.create({
      data: {
        name: body.name,
        status: (body.status as never) ?? "NEW",
        notes: body.notes ?? "",
        sector: "construction",
        ...crmFollowUpWrite({
          trade: body.trade ?? "",
          nextAction: body.nextAction ?? "",
          followUpDate: body.followUpDate ?? null,
          potentialFounder: body.potentialFounder ?? false,
          locality: body.locality ?? "",
        }),
      },
    });
    await writeAudit({ actorId: user.id, action: "ORG_CREATE", entityType: "Organisation", entityId: org.id });
    return org;
  });
}
