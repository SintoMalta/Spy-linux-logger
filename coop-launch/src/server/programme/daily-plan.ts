import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/server/auth/session";
import { AuthError } from "@/server/auth/session";
import { canManageProgramme } from "@/server/auth/rbac";

const BLOCKS = [
  { title: "Settle & priorities", minutes: 20 },
  { title: "Deep work", minutes: 100 },
  { title: "Outreach / Contacts", minutes: 60 },
  { title: "Admin & documents", minutes: 40 },
  { title: "Close-out", minutes: 20 },
] as const;

export async function ensureTodayPlan(user: SessionUser, date = new Date()) {
  if (!canManageProgramme(user)) {
    throw new AuthError("FORBIDDEN", "Daily plan is coordinator-scoped");
  }
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  let plan = await prisma.dailyPlan.findUnique({
    where: { userId_date: { userId: user.id, date: d } },
    include: { items: { orderBy: { order: "asc" } } },
  });
  if (!plan) {
    plan = await prisma.dailyPlan.create({
      data: {
        userId: user.id,
        date: d,
        plannedMinutes: 240,
        items: {
          create: BLOCKS.map((b, order) => ({
            title: b.title,
            minutes: b.minutes,
            order,
          })),
        },
      },
      include: { items: { orderBy: { order: "asc" } } },
    });
  }
  return plan;
}

/** Propose next-day priorities — does NOT mutate the next plan until user confirms. */
export async function proposeNextDayPriorities(user: SessionUser) {
  if (!canManageProgramme(user)) {
    throw new AuthError("FORBIDDEN", "Insufficient permissions");
  }
  const [stage, waiting, recentPeople, openActions] = await Promise.all([
    prisma.stage.findFirst({
      where: { status: "IN_PROGRESS", deletedAt: null },
      include: { gate: { include: { criteria: true } }, tasks: { where: { deletedAt: null } } },
    }),
    prisma.task.findMany({
      where: { status: { in: ["BLOCKED", "IN_PROGRESS"] }, deletedAt: null },
      take: 5,
    }),
    prisma.person.findMany({
      where: { deletedAt: null },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    prisma.founderActionRequest.findMany({
      where: { status: "OPEN", deletedAt: null },
      take: 5,
    }),
  ]);

  const proposals = [
    stage ? `Continue Week ${stage.weekNumber}: ${stage.title}` : "Review programme status",
    ...waiting.map((t) => `Follow waiting: ${t.title}`),
    ...recentPeople.map((p) => `Contacts follow-up: ${p.name}`),
    ...openActions.map((a) => `Founder ask open: ${a.title}`),
    ...(stage?.gate?.criteria.filter((c) => !c.satisfied).map((c) => `Week checklist open: ${c.label}`) ??
      []),
  ].slice(0, 8);

  return { proposals, autoMutate: false as const };
}

export async function saveEndOfDay(
  user: SessionUser,
  planId: string,
  endOfDayNotes: string,
) {
  if (!canManageProgramme(user)) {
    throw new AuthError("FORBIDDEN", "Insufficient permissions");
  }
  return prisma.dailyPlan.update({
    where: { id: planId },
    data: {
      notes: endOfDayNotes,
    },
  });
}
