import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withMutation, withSessionJson } from "@/server/http";
import { canManageProgramme, canSeeConfidentialFinancial } from "@/server/auth/rbac";
import { AuthError } from "@/server/auth/session";
import { stripConfidentialAnswers } from "@/server/market/problem-matrix";
import { writeAudit } from "@/server/audit";

const createSchema = z.object({
  templateId: z.string(),
  personId: z.string().optional().nullable(),
  organisationId: z.string().optional().nullable(),
  notes: z.string().optional(),
  status: z.enum(["DRAFT", "COMPLETED"]).optional(),
  answers: z
    .array(
      z.object({
        questionId: z.string(),
        valueText: z.string().optional().nullable(),
        valueNumber: z.number().optional().nullable(),
        valueBool: z.boolean().optional().nullable(),
        confidential: z.boolean().optional(),
        tagNames: z.array(z.string()).optional(),
      }),
    )
    .optional(),
});

export async function GET() {
  return withSessionJson(async (user) => {
    if (!canManageProgramme(user) && user.role !== "INDUSTRY_FOUNDER") {
      throw new AuthError("FORBIDDEN", "Insufficient permissions");
    }
    const interviews = await prisma.interview.findMany({
      where: { deletedAt: null },
      include: {
        person: true,
        organisation: true,
        answers: { include: { question: true, tags: { include: { tag: true } } } },
      },
      orderBy: { conductedAt: "desc" },
    });
    return interviews.map((iv) => ({
      ...iv,
      answers: stripConfidentialAnswers(iv.answers, user.role),
    }));
  });
}

export async function POST(request: Request) {
  return withMutation(request, async (user) => {
    if (!canManageProgramme(user)) throw new AuthError("FORBIDDEN", "Insufficient permissions");
    const body = createSchema.parse(await request.json());
    const interview = await prisma.interview.create({
      data: {
        templateId: body.templateId,
        personId: body.personId ?? null,
        organisationId: body.organisationId ?? null,
        interviewerId: user.id,
        notes: body.notes ?? "",
        status: body.status ?? "DRAFT",
      },
    });
    for (const a of body.answers ?? []) {
      if (!canSeeConfidentialFinancial(user)) {
        const q = await prisma.interviewTemplateQuestion.findUnique({ where: { id: a.questionId } });
        if (q?.kind === "CONFIDENTIAL_FINANCIAL" || a.confidential) {
          continue;
        }
      }
      const answer = await prisma.interviewAnswer.create({
        data: {
          interviewId: interview.id,
          questionId: a.questionId,
          valueText: a.valueText ?? null,
          valueNumber: a.valueNumber ?? null,
          valueBool: a.valueBool ?? null,
          confidential: a.confidential ?? false,
        },
      });
      for (const name of a.tagNames ?? []) {
        const tag = await prisma.problemTag.upsert({
          where: { name },
          update: {},
          create: { name },
        });
        await prisma.interviewAnswerTag.create({
          data: { answerId: answer.id, tagId: tag.id },
        });
      }
    }
    await writeAudit({ actorId: user.id, action: "INTERVIEW_CREATE", entityType: "Interview", entityId: interview.id });
    return interview;
  });
}
