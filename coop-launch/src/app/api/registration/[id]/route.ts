import { NextResponse } from "next/server";
import { z } from "zod";
import { AuthError, requireSession } from "@/server/auth/session";
import { canManageProgramme } from "@/server/auth/rbac";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/server/audit";
import { DomainError } from "@/server/programme/task-service";

const schema = z.object({
  completed: z.boolean(),
  evidenceDocumentId: z.string().optional().nullable(),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireSession();
    if (!canManageProgramme(user)) {
      throw new AuthError("FORBIDDEN", "Only coordinators can update registration");
    }
    const { id } = await context.params;
    const body = schema.parse(await request.json());

    if (body.evidenceDocumentId) {
      const doc = await prisma.document.findFirst({
        where: { id: body.evidenceDocumentId, deletedAt: null },
      });
      if (!doc) throw new DomainError("NOT_FOUND", "Evidence document not found");
    }

    const updated = await prisma.registrationRequirement.update({
      where: { id },
      data: {
        completed: body.completed,
        evidenceDocumentId:
          body.evidenceDocumentId === undefined
            ? undefined
            : body.evidenceDocumentId,
      },
    });

    await writeAudit({
      actorId: user.id,
      action: "REGISTRATION_UPDATED",
      entityType: "RegistrationRequirement",
      entityId: id,
      after: {
        completed: updated.completed,
        evidenceDocumentId: updated.evidenceDocumentId,
      },
    });

    return NextResponse.json({ ok: true, item: updated });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json(
        { error: err.message },
        { status: err.code === "UNAUTHENTICATED" ? 401 : 403 },
      );
    }
    if (err instanceof DomainError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: 400 });
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
