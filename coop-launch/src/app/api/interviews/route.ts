import { NextResponse } from "next/server";
import { z } from "zod";
import { AuthError, requireSession } from "@/server/auth/session";
import { canManageProgramme } from "@/server/auth/rbac";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/server/audit";
import { DomainError } from "@/server/programme/task-service";

const schema = z.object({
  organisationId: z.string().min(1),
  personId: z.string().optional(),
  notes: z.string().optional(),
  problemText: z.string().min(1),
  problemTag: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const user = await requireSession();
    if (!canManageProgramme(user)) {
      throw new AuthError("FORBIDDEN", "Only coordinators can log interviews");
    }
    const body = schema.parse(await request.json());

    const org = await prisma.organisation.findFirst({
      where: { id: body.organisationId, deletedAt: null },
    });
    if (!org) throw new DomainError("NOT_FOUND", "Organisation not found");

    let template = await prisma.interviewTemplate.findFirst({
      where: { name: "Discovery v1" },
      include: { questions: { orderBy: { order: "asc" } } },
    });
    if (!template) {
      template = await prisma.interviewTemplate.create({
        data: {
          name: "Discovery v1",
          description: "Problem discovery interview",
          questions: {
            create: [
              { prompt: "What is the main procurement pain?", kind: "TEXT", order: 0 },
              { prompt: "Tag the problem theme", kind: "TAG", order: 1 },
            ],
          },
        },
        include: { questions: { orderBy: { order: "asc" } } },
      });
    }

    const tag = await prisma.problemTag.upsert({
      where: { name: body.problemTag.trim() },
      update: {},
      create: { name: body.problemTag.trim() },
    });

    const interview = await prisma.interview.create({
      data: {
        templateId: template.id,
        organisationId: org.id,
        personId: body.personId || null,
        interviewerId: user.id,
        notes: body.notes?.trim() || "",
      },
    });

    const qText = template.questions.find((q) => q.kind === "TEXT");
    const qTag = template.questions.find((q) => q.kind === "TAG");
    if (qText) {
      const a = await prisma.interviewAnswer.create({
        data: {
          interviewId: interview.id,
          questionId: qText.id,
          valueText: body.problemText.trim(),
        },
      });
      await prisma.interviewAnswerTag.create({
        data: { answerId: a.id, tagId: tag.id },
      });
    }
    if (qTag) {
      const a = await prisma.interviewAnswer.create({
        data: {
          interviewId: interview.id,
          questionId: qTag.id,
          valueText: body.problemTag.trim(),
        },
      });
      await prisma.interviewAnswerTag.create({
        data: { answerId: a.id, tagId: tag.id },
      });
    }

    await writeAudit({
      actorId: user.id,
      action: "INTERVIEW_LOGGED",
      entityType: "Interview",
      entityId: interview.id,
      after: { organisationId: org.id, tag: tag.name },
    });

    return NextResponse.json({ ok: true, interview });
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
