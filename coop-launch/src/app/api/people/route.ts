import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withMutation, withSessionJson } from "@/server/http";
import { canManageProgramme, canWriteCrm } from "@/server/auth/rbac";
import { AuthError } from "@/server/auth/session";
import { writeAudit } from "@/server/audit";

const schema = z.object({
  name: z.string().min(1),
  organisationId: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  roleTitle: z.string().optional(),
  trade: z.string().optional(),
  status: z.string().optional(),
  notes: z.string().optional(),
  nextAction: z.string().optional(),
  followUpDate: z.string().optional().nullable(),
  potentialFounder: z.boolean().optional(),
});

export async function GET(request: Request) {
  return withSessionJson(async (user) => {
    if (!canManageProgramme(user) && user.role !== "INDUSTRY_FOUNDER") {
      throw new AuthError("FORBIDDEN", "Insufficient permissions");
    }
    const url = new URL(request.url);
    const q = url.searchParams.get("q")?.toLowerCase();
    const status = url.searchParams.get("status");
    const trade = url.searchParams.get("trade");
    const potentialFounder = url.searchParams.get("potentialFounder");
    const followUpDue = url.searchParams.get("followUpDue");
    return prisma.person.findMany({
      where: {
        deletedAt: null,
        ...(status ? { status: status as never } : {}),
        ...(trade ? { trade } : {}),
        ...(potentialFounder === "true" ? { potentialFounder: true } : {}),
        ...(followUpDue === "true" ? { followUpDate: { lte: new Date() } } : {}),
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { trade: { contains: q, mode: "insensitive" } },
                { organisation: { name: { contains: q, mode: "insensitive" } } },
              ],
            }
          : {}),
      },
      include: { organisation: true },
      orderBy: { name: "asc" },
    });
  });
}

export async function POST(request: Request) {
  return withMutation(request, async (user) => {
    if (!canWriteCrm(user)) throw new AuthError("FORBIDDEN", "Cannot write CRM");
    const body = schema.parse(await request.json());
    const person = await prisma.person.create({
      data: {
        name: body.name,
        organisationId: body.organisationId ?? null,
        email: body.email ?? null,
        phone: body.phone ?? null,
        roleTitle: body.roleTitle,
        trade: body.trade ?? "",
        status: (body.status as never) ?? "NEW",
        notes: body.notes ?? "",
        nextAction: body.nextAction ?? "",
        followUpDate: body.followUpDate ? new Date(body.followUpDate) : null,
        potentialFounder: body.potentialFounder ?? false,
      },
    });
    await writeAudit({ actorId: user.id, action: "PERSON_CREATE", entityType: "Person", entityId: person.id });
    return person;
  });
}
