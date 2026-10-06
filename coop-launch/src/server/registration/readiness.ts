import type { RegistrationPriority } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type ReadinessResult = {
  percent: number;
  blocked: boolean;
  blockers: { code: string; title: string }[];
  total: number;
  completed: number;
  mandatoryTotal: number;
  mandatoryCompleted: number;
};

export function computeReadinessPercent(input: {
  items: {
    priority: RegistrationPriority;
    completed: boolean;
    evidenceDocumentId: string | null;
    code: string;
    title: string;
  }[];
}): ReadinessResult {
  const total = input.items.length;
  const completed = input.items.filter((i) => i.completed).length;
  const mandatory = input.items.filter((i) => i.priority === "MANDATORY");
  const blockers = mandatory
    .filter((i) => !i.completed || !i.evidenceDocumentId)
    .map((i) => ({ code: i.code, title: i.title }));
  const mandatoryCompleted = mandatory.length - blockers.length;
  const raw =
    total === 0 ? 0 : Math.round((completed / total) * 100);
  const blocked = blockers.length > 0;
  const percent = blocked ? Math.min(raw, 99) : raw;
  return {
    percent,
    blocked,
    blockers,
    total,
    completed,
    mandatoryTotal: mandatory.length,
    mandatoryCompleted,
  };
}

export async function getRegistrationReadiness(): Promise<ReadinessResult> {
  const items = await prisma.registrationRequirement.findMany({
    orderBy: { code: "asc" },
  });
  return computeReadinessPercent({ items });
}
