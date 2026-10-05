/**
 * Production programme seed — NO demo users, NO fictional CRM contacts.
 * Seeds: 12-week programme + gates + DoD + templates + registration checklist only.
 *
 * Usage: NODE_ENV=production ALLOW_PROD_PROGRAMME_SEED=true pnpm exec tsx scripts/seed-production-programme.ts
 */
import { PrismaClient } from "@prisma/client";
import { TEMPLATE_BODIES } from "../src/server/governance/decisions";
import {
  PROGRAMME_WEEKS,
  REGISTRATION_CHECKLIST,
  INTERVIEW_TOPICS,
} from "../src/server/programme/programme-data";

const prisma = new PrismaClient();

async function main() {
  if (process.env.ALLOW_PROD_PROGRAMME_SEED !== "true") {
    console.error("Set ALLOW_PROD_PROGRAMME_SEED=true to run production programme seed.");
    process.exit(1);
  }

  for (const week of PROGRAMME_WEEKS) {
    const stage = await prisma.stage.upsert({
      where: { weekNumber: week.weekNumber },
      update: {
        title: week.title,
        description: week.description,
        order: week.weekNumber,
        status: week.weekNumber === 1 ? "IN_PROGRESS" : "NOT_STARTED",
        deletedAt: null,
      },
      create: {
        weekNumber: week.weekNumber,
        title: week.title,
        description: week.description,
        order: week.weekNumber,
        status: week.weekNumber === 1 ? "IN_PROGRESS" : "NOT_STARTED",
      },
    });

    for (const t of week.tasks) {
      let task = await prisma.task.findFirst({ where: { stageId: stage.id, title: t.title } });
      if (!task) {
        task = await prisma.task.create({
          data: {
            stageId: stage.id,
            title: t.title,
            description: t.description,
            status: week.weekNumber === 1 ? "IN_PROGRESS" : "NOT_STARTED",
          },
        });
      }
      for (let i = 0; i < t.dod.length; i++) {
        const label = t.dod[i];
        const existing = await prisma.definitionOfDoneCriterion.findFirst({
          where: { taskId: task.id, label },
        });
        if (!existing) {
          await prisma.definitionOfDoneCriterion.create({
            data: { taskId: task.id, label, order: i },
          });
        }
      }
    }

    const gate =
      (await prisma.gate.findUnique({ where: { stageId: stage.id } })) ??
      (await prisma.gate.create({
        data: { stageId: stage.id, title: week.gateTitle, description: week.gateDescription },
      }));
    await prisma.gate.update({
      where: { id: gate.id },
      data: { title: week.gateTitle, description: week.gateDescription },
    });
    for (let i = 0; i < week.criteria.length; i++) {
      const c = week.criteria[i];
      const existing = await prisma.gateCriterion.findFirst({
        where: { gateId: gate.id, label: c.label },
      });
      if (!existing) {
        await prisma.gateCriterion.create({
          data: {
            gateId: gate.id,
            type: c.type,
            label: c.label,
            targetValue: c.targetValue,
            metricKey: c.metricKey ?? "NONE",
            code: c.code,
            order: i,
          },
        });
      }
    }
  }

  const template = await prisma.interviewTemplate.findFirst({
    where: { name: "Construction discovery v1" },
  });
  if (!template) {
    await prisma.interviewTemplate.create({
      data: {
        name: "Construction discovery v1",
        description: "Structured construction interview",
        questions: {
          create: INTERVIEW_TOPICS.map((q, order) => ({
            prompt: q.prompt,
            topic: q.topic,
            kind: q.kind ?? "TEXT",
            order,
          })),
        },
      },
    });
  }

  for (const req of REGISTRATION_CHECKLIST) {
    await prisma.registrationRequirement.upsert({
      where: { code: req.code },
      update: {
        title: req.title,
        description: req.description,
        priority: req.priority,
      },
      create: req,
    });
  }

  await prisma.template.upsert({
    where: { code: "SEC31_INTRO" },
    update: { body: TEMPLATE_BODIES.SEC31_INTRO },
    create: {
      code: "SEC31_INTRO",
      name: "§31 Introduction",
      category: "COMMS",
      body: TEMPLATE_BODIES.SEC31_INTRO,
    },
  });
  await prisma.template.upsert({
    where: { code: "SEC32_OUTREACH" },
    update: { body: TEMPLATE_BODIES.SEC32_OUTREACH },
    create: {
      code: "SEC32_OUTREACH",
      name: "§32 Outreach",
      category: "COMMS",
      body: TEMPLATE_BODIES.SEC32_OUTREACH,
    },
  });

  console.log("Production programme seed complete (no users, no fictional CRM).");
  console.log("Next: ALLOW_BOOTSTRAP=true pnpm exec tsx scripts/bootstrap-admin.ts (per real user).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
