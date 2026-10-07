import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { canSeeConfidentialFinancial } from "@/server/auth/rbac";
import type { SessionUser } from "@/server/auth/session";

export type ProblemMatrixRow = {
  tag: string;
  count: number;
  sampleNotes: string[];
};

export async function getProblemMatrix(
  user: SessionUser,
): Promise<ProblemMatrixRow[]> {
  const tags = await prisma.problemTag.findMany({
    include: {
      answers: {
        include: {
          answer: {
            include: {
              question: true,
              interview: true,
            },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const allowConfidential = canSeeConfidentialFinancial(user);

  return tags.map((tag) => {
    const usable = tag.answers.filter((link) => {
      const q = link.answer.question;
      if (q.kind === "CONFIDENTIAL_FINANCIAL" && !allowConfidential) {
        return false;
      }
      if (link.answer.confidential && !allowConfidential) return false;
      return true;
    });
    const sampleNotes = usable
      .map((l) => l.answer.valueText)
      .filter((v): v is string => Boolean(v))
      .slice(0, 5);
    return {
      tag: tag.name,
      count: usable.length,
      sampleNotes,
    };
  });
}

export function stripConfidentialAnswers<
  T extends {
    confidential: boolean;
    question: { kind: string };
    valueText: string | null;
    valueNumber: number | null;
  },
>(answers: T[], role: Role): T[] {
  const user = { role } as SessionUser;
  if (canSeeConfidentialFinancial(user)) return answers;
  return answers.map((a) => {
    if (a.confidential || a.question.kind === "CONFIDENTIAL_FINANCIAL") {
      return {
        ...a,
        valueText: null,
        valueNumber: null,
      };
    }
    return a;
  });
}
