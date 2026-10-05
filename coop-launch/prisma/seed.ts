import { PrismaClient, type Role } from "@prisma/client";
import * as argon2 from "argon2";
import { TEMPLATE_BODIES } from "../src/server/governance/decisions";
import { calculateMemberValue } from "../src/server/economic/finance";
import {
  INTERVIEW_TOPICS,
  PROGRAMME_WEEKS,
  REGISTRATION_CHECKLIST,
} from "../src/server/programme/programme-data";

const prisma = new PrismaClient();

async function hash(pw: string) {
  return argon2.hash(pw, {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });
}

async function upsertUser(
  email: string,
  name: string,
  role: Role,
  password: string,
  mustChangePassword = false,
) {
  const passwordHash = await hash(password);
  return prisma.user.upsert({
    where: { email },
    update: { name, role, passwordHash, active: true, deletedAt: null, mustChangePassword },
    create: { email, name, role, passwordHash, mustChangePassword },
  });
}

async function main() {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEMO_SEED !== "true") {
    console.error(
      "Refusing demo seed in production. Use scripts/bootstrap-admin.ts for the first ADMIN/COORDINATOR.",
    );
    process.exit(1);
  }

  // Clear volatile demo data for idempotent programme rebuild (dev/test only)
  if (process.env.SEED_RESET === "true") {
    await prisma.$executeRawUnsafe(`
      TRUNCATE TABLE
        "InterviewAnswerTag","InterviewAnswer","Interview","InterviewTemplateQuestion","InterviewTemplate",
        "Communication","FounderAssessment","SupplierDiscussion","SupplierOffer","Supplier",
        "FinancialAssumption","MemberValueStatement","AdviceItem","MeetingAttendee","Decision","Meeting","Risk",
        "RegistrationRequirement","Document","FounderActionRequest","DailyPlanItem","DailyPlan","TimeEntry",
        "TaskNote","DefinitionOfDoneCriterion","TaskChecklistItem","TaskDependency","Task",
        "GateOverride","GateReview","GateCriterion","Gate","Stage","ProgrammeFlag","ProblemTag","Template",
        "Notification","WeeklyReport","AuditLog","Organisation","Person"
      CASCADE;
    `);
  }

  const nesli = await upsertUser(
    "nesli@cooplaunch.mt",
    "Nesli",
    "COORDINATOR",
    "ChangeMeNow!",
    true,
  );
  const founder = await upsertUser(
    "founder@cooplaunch.mt",
    "Industry Founder",
    "INDUSTRY_FOUNDER",
    "ChangeMeNow!",
    true,
  );
  const adviser = await upsertUser(
    "adviser@cooplaunch.mt",
    "Programme Adviser",
    "ADVISER",
    "ChangeMeNow!",
    true,
  );
  await upsertUser("admin@cooplaunch.mt", "Admin", "ADMIN", "ChangeMeNow!", true);

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
      let task = await prisma.task.findFirst({
        where: { stageId: stage.id, title: t.title },
      });
      if (!task) {
        task = await prisma.task.create({
          data: {
            stageId: stage.id,
            title: t.title,
            description: t.description,
            ownerUserId: nesli.id,
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
        data: {
          stageId: stage.id,
          title: week.gateTitle,
          description: week.gateDescription,
        },
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
      } else {
        await prisma.gateCriterion.update({
          where: { id: existing.id },
          data: {
            type: c.type,
            targetValue: c.targetValue,
            metricKey: c.metricKey ?? "NONE",
            code: c.code,
            order: i,
          },
        });
      }
    }
  }

  // Construction-only fictional CRM
  const orgs = [
    {
      id: "seed-org-volt",
      name: "Volt & Sparks Demo Electrical Ltd (FICTIONAL)",
      trade: "electrical",
      status: "CONTACTED" as const,
      potentialFounder: true,
      locality: "Birkirkara (demo)",
    },
    {
      id: "seed-org-pipe",
      name: "AquaFlow Demo Plumbing Co (FICTIONAL)",
      trade: "plumbing",
      status: "INTERVIEW_SCHEDULED" as const,
      potentialFounder: false,
      locality: "Mosta (demo)",
    },
    {
      id: "seed-org-build",
      name: "StonePath Demo Builders (FICTIONAL)",
      trade: "builder",
      status: "NEW" as const,
      potentialFounder: true,
      locality: "Żebbuġ (demo)",
    },
    {
      id: "seed-org-mat",
      name: "HardBase Demo Materials Supply (FICTIONAL)",
      trade: "materials_supplier",
      status: "CONTACTED" as const,
      potentialFounder: false,
      locality: "Ħal Far (demo)",
    },
    {
      id: "seed-org-roof",
      name: "RidgeLine Demo Roofing (FICTIONAL)",
      trade: "builder",
      status: "FUTURE_MEMBER" as const,
      potentialFounder: false,
      locality: "Rabat (demo)",
    },
    {
      id: "seed-org-skip",
      name: "SkipMe Demo Contractors (FICTIONAL)",
      trade: "builder",
      status: "DO_NOT_PURSUE" as const,
      potentialFounder: false,
      locality: "n/a",
    },
  ];

  for (const o of orgs) {
    await prisma.organisation.upsert({
      where: { id: o.id },
      update: {
        name: o.name,
        trade: o.trade,
        sector: "construction",
        status: o.status,
        potentialFounder: o.potentialFounder,
        locality: o.locality,
        notes: "Obviously fictional construction demo contact",
        deletedAt: null,
      },
      create: {
        id: o.id,
        name: o.name,
        trade: o.trade,
        sector: "construction",
        status: o.status,
        potentialFounder: o.potentialFounder,
        locality: o.locality,
        notes: "Obviously fictional construction demo contact",
      },
    });
  }

  const people = [
    {
      id: "seed-person-alex",
      organisationId: "seed-org-volt",
      name: "Alex Demo-Electric",
      trade: "electrical",
      status: "POTENTIAL_FOUNDER" as const,
      potentialFounder: true,
      roleTitle: "Owner",
    },
    {
      id: "seed-person-blair",
      organisationId: "seed-org-pipe",
      name: "Blair Demo-Plumb",
      trade: "plumbing",
      status: "INTERVIEW_SCHEDULED" as const,
      potentialFounder: false,
      roleTitle: "Supervisor",
    },
    {
      id: "seed-person-casey",
      organisationId: "seed-org-build",
      name: "Casey Demo-Build",
      trade: "builder",
      status: "POTENTIAL_FOUNDER" as const,
      potentialFounder: true,
      roleTitle: "Director",
    },
  ];

  for (const p of people) {
    await prisma.person.upsert({
      where: { id: p.id },
      update: { ...p, email: `${p.id}@example.invalid`, deletedAt: null },
      create: { ...p, email: `${p.id}@example.invalid` },
    });
  }

  let template = await prisma.interviewTemplate.findFirst({
    where: { name: "Construction discovery v1" },
    include: { questions: true },
  });
  if (!template) {
    template = await prisma.interviewTemplate.create({
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
      include: { questions: true },
    });
  }

  for (const tag of [
    "Materials price volatility",
    "Payment delays",
    "Labour shortages",
    "Tender access barriers",
  ]) {
    await prisma.problemTag.upsert({
      where: { name: tag },
      update: {},
      create: { name: tag },
    });
  }

  // Supplier
  const supplier = await prisma.supplier.upsert({
    where: { id: "seed-supplier-hardbase" },
    update: {
      name: "HardBase Demo Materials Supply (FICTIONAL)",
      category: "construction_materials",
      contact: "sales-demo@example.invalid",
    },
    create: {
      id: "seed-supplier-hardbase",
      name: "HardBase Demo Materials Supply (FICTIONAL)",
      category: "construction_materials",
      contact: "sales-demo@example.invalid",
      notes: "Fictional materials supplier for demo offers",
    },
  });

  if ((await prisma.supplierDiscussion.count({ where: { supplierId: supplier.id } })) === 0) {
    await prisma.supplierDiscussion.create({
      data: {
        supplierId: supplier.id,
        userId: nesli.id,
        summary: "Intro call on collective dry materials basket (fictional).",
      },
    });
  }
  if ((await prisma.supplierOffer.count({ where: { supplierId: supplier.id } })) === 0) {
    await prisma.supplierOffer.create({
      data: {
        supplierId: supplier.id,
        description: "Demo collective materials basket",
        unitPrice: 2500,
        currency: "EUR",
        discountPct: 6,
        terms: "Net 30 — fictional",
        assumptionConfidence: "ESTIMATE",
      },
    });
  }

  for (const scenario of ["CONSERVATIVE", "BASE", "UPSIDE"] as const) {
    const discount = scenario === "CONSERVATIVE" ? "4" : scenario === "BASE" ? "7" : "10";
    await prisma.financialAssumption.upsert({
      where: { key_scenario: { key: "materials_discount_pct", scenario } },
      update: {
        label: "Expected materials discount",
        value: discount,
        unit: "%",
        confidence: scenario === "BASE" ? "ESTIMATE" : "ASSUMPTION",
      },
      create: {
        key: "materials_discount_pct",
        scenario,
        label: "Expected materials discount",
        value: discount,
        unit: "%",
        confidence: scenario === "BASE" ? "ESTIMATE" : "ASSUMPTION",
      },
    });
    await prisma.financialAssumption.upsert({
      where: { key_scenario: { key: "membership_fee", scenario } },
      update: {
        label: "Annual membership fee",
        value: "300",
        unit: "EUR",
        confidence: "VERIFIED",
      },
      create: {
        key: "membership_fee",
        scenario,
        label: "Annual membership fee",
        value: "300",
        unit: "EUR",
        confidence: "VERIFIED",
      },
    });
    await prisma.financialAssumption.upsert({
      where: { key_scenario: { key: "startup_cost", scenario } },
      update: {
        label: "Startup cost",
        value: scenario === "UPSIDE" ? "8000" : "12000",
        unit: "EUR",
        confidence: "ESTIMATE",
      },
      create: {
        key: "startup_cost",
        scenario,
        label: "Startup cost",
        value: scenario === "UPSIDE" ? "8000" : "12000",
        unit: "EUR",
        confidence: "ESTIMATE",
      },
    });
  }

  if ((await prisma.memberValueStatement.count()) === 0) {
    const mv = calculateMemberValue({
      annualSpend: 80000,
      coopDiscountPct: 7,
      membershipFee: 300,
      hoursSaved: 48,
      hourlyValue: 30,
    });
    await prisma.memberValueStatement.create({
      data: {
        memberLabel: "Illustrative electrical member (fictional)",
        inputsJson: {
          annualSpend: 80000,
          coopDiscountPct: 7,
          membershipFee: 300,
          hoursSaved: 48,
          hourlyValue: 30,
        },
        resultJson: mv,
        createdById: nesli.id,
      },
    });
  }

  if ((await prisma.adviceItem.count()) === 0) {
    await prisma.adviceItem.create({
      data: {
        category: "Legal",
        title: "Confirm cooperative registration pathway (Malta)",
        body: "Seek formal legal advice before committing to a registration timeline. No outcome promised.",
        status: "AWAITING_RESPONSE",
        adviserId: adviser.id,
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
        responsibleUserId: nesli.id,
      },
      create: {
        ...req,
        responsibleUserId: nesli.id,
      },
    });
  }

  await prisma.template.upsert({
    where: { code: "SEC31_INTRO" },
    update: { body: TEMPLATE_BODIES.SEC31_INTRO, name: "§31 Introduction" },
    create: {
      code: "SEC31_INTRO",
      name: "§31 Introduction",
      category: "COMMS",
      body: TEMPLATE_BODIES.SEC31_INTRO,
    },
  });
  await prisma.template.upsert({
    where: { code: "SEC32_OUTREACH" },
    update: { body: TEMPLATE_BODIES.SEC32_OUTREACH, name: "§32 Outreach" },
    create: {
      code: "SEC32_OUTREACH",
      name: "§32 Outreach",
      category: "COMMS",
      body: TEMPLATE_BODIES.SEC32_OUTREACH,
    },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const plan = await prisma.dailyPlan.upsert({
    where: { userId_date: { userId: nesli.id, date: today } },
    update: {
      plannedMinutes: 240,
      notes: "4h structure: 20 settle / 100 deep / 60 outreach / 40 admin / 20 close",
    },
    create: {
      userId: nesli.id,
      date: today,
      plannedMinutes: 240,
      notes: "4h structure: 20 settle / 100 deep / 60 outreach / 40 admin / 20 close",
    },
  });
  if ((await prisma.dailyPlanItem.count({ where: { planId: plan.id } })) === 0) {
    await prisma.dailyPlanItem.createMany({
      data: [
        { planId: plan.id, title: "Settle & priorities", minutes: 20, order: 0, blockKey: "settle" },
        { planId: plan.id, title: "Deep work — charter / evidence", minutes: 100, order: 1, blockKey: "deep" },
        { planId: plan.id, title: "Outreach / CRM follow-ups", minutes: 60, order: 2, blockKey: "outreach" },
        { planId: plan.id, title: "Admin & documents", minutes: 40, order: 3, blockKey: "admin" },
        { planId: plan.id, title: "Close-out & next-day notes", minutes: 20, order: 4, blockKey: "close" },
      ],
    });
  }

  if (
    (await prisma.founderActionRequest.count({
      where: { assigneeId: founder.id, deletedAt: null },
    })) === 0
  ) {
    await prisma.founderActionRequest.createMany({
      data: [
        {
          title: "Introduce Nesli to Alex Demo-Electric",
          detail: "Warm introduction only — no commitments.",
          kind: "INTRODUCTION",
          assigneeId: founder.id,
          createdById: nesli.id,
        },
        {
          title: "Review founder assessment draft for Casey",
          detail: "Careful language — prompts not verdicts.",
          kind: "REVIEW_CANDIDATE",
          assigneeId: founder.id,
          createdById: nesli.id,
        },
      ],
    });
  }

  console.log("Seed complete (construction demo + operational 12-week programme).");
  console.log("Demo users only when NODE_ENV≠production. Password: ChangeMeNow!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
