import { NextResponse } from "next/server";
import { z } from "zod";
import { AuthError, requireSession } from "@/server/auth/session";
import { canManageProgramme } from "@/server/auth/rbac";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/server/audit";
import { DomainError } from "@/server/programme/task-service";

const schema = z.object({
  title: z.string().min(1),
  detail: z.string().optional(),
  assigneeId: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const user = await requireSession();
    if (!canManageProgramme(user)) {
      throw new AuthError("FORBIDDEN", "Only coordinators can create founder asks");
    }
    const body = schema.parse(await request.json());
    const assignee = await prisma.user.findFirst({
      where: {
        id: body.assigneeId,
        active: true,
        deletedAt: null,
        role: { in: ["INDUSTRY_FOUNDER", "FOUNDING_MEMBER"] },
      },
    });
    if (!assignee) throw new DomainError("NOT_FOUND", "Assignee not found");

    const item = await prisma.founderActionRequest.create({
      data: {
        title: body.title.trim(),
        detail: body.detail?.trim() || "",
        assigneeId: assignee.id,
        createdById: user.id,
        status: "OPEN",
      },
    });
    await writeAudit({
      actorId: user.id,
      action: "FOUNDER_ACTION_CREATED",
      entityType: "FounderActionRequest",
      entityId: item.id,
      after: { title: item.title, assigneeId: item.assigneeId },
    });
    return NextResponse.json({ ok: true, item });
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
