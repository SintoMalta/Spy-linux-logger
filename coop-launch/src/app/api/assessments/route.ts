import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withMutation, withSessionJson } from "@/server/http";
import { canManageProgramme } from "@/server/auth/rbac";
import { AuthError } from "@/server/auth/session";
import { writeAudit } from "@/server/audit";

const schema = z.object({
  title: z.string().min(1),
  personId: z.string().optional().nullable(),
  organisationId: z.string().optional().nullable(),
  positiveNotes: z.string().optional(),
  redFlagPrompts: z.string().optional(),
  evidenceNotes: z.string().optional(),
  status: z.string().optional(),
});

export async function GET() {
  return withSessionJson(async (user) => {
    if (!canManageProgramme(user) && user.role !== "INDUSTRY_FOUNDER") {
      throw new AuthError("FORBIDDEN", "Insufficient permissions");
    }
    return prisma.founderAssessment.findMany({
      where: { deletedAt: null },
      include: { person: true, organisation: true },
      orderBy: { updatedAt: "desc" },
    });
  });
}

export async function POST(request: Request) {
  return withMutation(request, async (user) => {
    if (!canManageProgramme(user)) throw new AuthError("FORBIDDEN", "Insufficient permissions");
    const body = schema.parse(await request.json());
    const item = await prisma.founderAssessment.create({
      data: {
        title: body.title,
        personId: body.personId ?? null,
        organisationId: body.organisationId ?? null,
        authorId: user.id,
        positiveNotes: body.positiveNotes ?? "",
        redFlagPrompts: body.redFlagPrompts ?? "",
        evidenceNotes: body.evidenceNotes ?? "",
        status: body.status ?? "DRAFT",
      },
    });
    await writeAudit({ actorId: user.id, action: "ASSESSMENT_CREATE", entityType: "FounderAssessment", entityId: item.id });
    return item;
  });
}
