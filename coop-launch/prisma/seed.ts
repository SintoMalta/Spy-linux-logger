import { PrismaClient, type Role } from "@prisma/client";
import * as argon2 from "argon2";
import { TEMPLATE_BODIES } from "../src/server/governance/decisions";
import { calculateMemberValue } from "../src/server/economic/finance";

const prisma = new PrismaClient();

async function hash(pw: string) {
  return argon2.hash(pw, {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });
}

const WEEKS: { title: string; description: string; tasks: string[]; gate: string }[] = [
  {
    title: "Kick-off & framing",
    description: "Align founders on purpose, scope, and evidence standards.",
    tasks: ["Charter draft started", "Working rhythm agreed"],
    gate: "Founders aligned; charter draft started",
  },
  {
    title: "Stakeholder map",
    description: "Map organisations and people to interview.",
    tasks: ["CRM seeded with target list", "Interview plan approved"],
    gate: "CRM seeded; interview plan approved",
  },
  {
    title: "Problem discovery",
    description: "Conduct discovery interviews.",
    tasks: ["Log first interview set", "Tag recurring problems"],
    gate: "Interviews logged; tags populated",
  },
  {
    title: "Problem Matrix",
    description: "Aggregate and rank problems without leaking confidential figures.",
    tasks: ["Build Problem Matrix view", "Rank top problems with evidence"],
    gate: "Matrix reviewed; top problems ranked",
  },
  {
    title: "Founder fit",
    description: "Draft founder assessment with careful language.",
    tasks: ["Draft FounderAssessment", "Capture evidence notes"],
    gate: "Assessment drafted (careful language)",
  },
  {
    title: "Solution options",
    description: "Document solution options with evidence links.",
    tasks: ["Option shortlist documented", "Evidence attached to options"],
    gate: "Options documented with evidence",
  },
  {
    title: "Supplier scan",
    description: "Collect comparable supplier offers.",
    tasks: ["Identify suppliers", "Capture comparable offers"],
    gate: "At least one comparable offer set",
  },
  {
    title: "Economics",
    description: "Label assumptions and build scenarios.",
    tasks: ["Record labelled assumptions", "Build scenario A/B"],
    gate: "Assumptions labelled; scenarios present",
  },
  {
    title: "Member value",
    description: "Draft member value statement from labelled inputs.",
    tasks: ["Draft MemberValueStatement", "Review with founder"],
    gate: "Draft MemberValueStatement complete",
  },
  {
    title: "Governance pack",
    description: "Advice, risks, and decisions current.",
    tasks: ["Advice register current", "Risks and decisions updated"],
    gate: "Governance pack current",
  },
  {
    title: "Registration pack",
    description: "Open checklist and list blockers.",
    tasks: ["Open registration checklist", "List mandatory blockers"],
    gate: "Checklist open; blockers listed",
  },
  {
    title: "Go / no-go",
    description: "Gate review and registration readiness check.",
    tasks: ["Run final gate review", "Confirm registration readiness"],
    gate: "Gate review complete; readiness reviewed",
  },
];

async function upsertUser(
  email: string,
  name: string,
  role: Role,
  password: string,
) {
  const passwordHash = await hash(password);
  return prisma.user.upsert({
    where: { email },
    update: { name, role, passwordHash, active: true, deletedAt: null },
    create: { email, name, role, passwordHash },
  });
}

async function main() {
  const nesli = await upsertUser(
    "nesli@cooplaunch.mt",
    "Nesli",
    "COORDINATOR",
    "ChangeMeNow!",
  );
  const founder = await upsertUser(
    "founder@cooplaunch.mt",
    "Industry Founder",
    "INDUSTRY_FOUNDER",
    "ChangeMeNow!",
  );
  const adviser = await upsertUser(
    "adviser@cooplaunch.mt",
    "Programme Adviser",
    "ADVISER",
    "ChangeMeNow!",
  );
  await upsertUser("admin@cooplaunch.mt", "Admin", "ADMIN", "ChangeMeNow!");

  for (let i = 0; i < WEEKS.length; i++) {
    const week = i + 1;
    const w = WEEKS[i];
    const stage = await prisma.stage.upsert({
      where: { weekNumber: week },
      update: {
        title: w.title,
        description: w.description,
        order: week,
        status: week === 1 ? "IN_PROGRESS" : "NOT_STARTED",
        deletedAt: null,
      },
      create: {
        weekNumber: week,
        title: w.title,
        description: w.description,
        order: week,
        status: week === 1 ? "IN_PROGRESS" : "NOT_STARTED",
      },
    });

    for (const taskTitle of w.tasks) {
      const existing = await prisma.task.findFirst({
        where: { stageId: stage.id, title: taskTitle },
      });
      const task =
        existing ??
        (await prisma.task.create({
          data: {
            stageId: stage.id,
            title: taskTitle,
            description: `${taskTitle} for week ${week}`,
            ownerUserId: nesli.id,
            status: week === 1 ? "IN_PROGRESS" : "NOT_STARTED",
          },
        }));

      const dodLabel = `Evidence recorded for: ${taskTitle}`;
      const dod = await prisma.definitionOfDoneCriterion.findFirst({
        where: { taskId: task.id, label: dodLabel },
      });
      if (!dod) {
        await prisma.definitionOfDoneCriterion.create({
          data: { taskId: task.id, label: dodLabel, order: 0 },
        });
      }
      const check = await prisma.taskChecklistItem.findFirst({
        where: { taskId: task.id },
      });
      if (!check) {
        await prisma.taskChecklistItem.create({
          data: { taskId: task.id, label: "Capture notes / artefact", order: 0 },
        });
      }
    }

    const gate =
      (await prisma.gate.findUnique({ where: { stageId: stage.id } })) ??
      (await prisma.gate.create({
        data: {
          stageId: stage.id,
          title: `Week ${week} gate`,
          description: w.gate,
        },
      }));

    const critLabel = w.gate;
    const crit = await prisma.gateCriterion.findFirst({
      where: { gateId: gate.id, label: critLabel },
    });
    if (!crit) {
      await prisma.gateCriterion.create({
        data: {
          gateId: gate.id,
          type: "MANUAL_APPROVAL",
          label: critLabel,
          order: 0,
        },
      });
    }
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const plan = await prisma.dailyPlan.upsert({
    where: { userId_date: { userId: nesli.id, date: today } },
    update: { plannedMinutes: 240, notes: "Focus on week 1 evidence" },
    create: {
      userId: nesli.id,
      date: today,
      plannedMinutes: 240,
      notes: "Focus on week 1 evidence",
    },
  });
  const planItemCount = await prisma.dailyPlanItem.count({ where: { planId: plan.id } });
  if (planItemCount === 0) {
    await prisma.dailyPlanItem.createMany({
      data: [
        { planId: plan.id, title: "Review charter draft", minutes: 60, order: 0 },
        { planId: plan.id, title: "Call Industry Founder", minutes: 30, order: 1 },
        { planId: plan.id, title: "Prepare interview list", minutes: 90, order: 2 },
        { planId: plan.id, title: "Update gate notes", minutes: 60, order: 3 },
      ],
    });
  }

  await prisma.founderActionRequest.createMany({
    data: [
      {
        title: "Confirm availability for kick-off call",
        detail: "Propose two slots this week.",
        assigneeId: founder.id,
        createdById: nesli.id,
        status: "OPEN",
      },
      {
        title: "Share three target organisations",
        detail: "Names only — no confidential pricing.",
        assigneeId: founder.id,
        createdById: nesli.id,
        status: "OPEN",
      },
    ],
    skipDuplicates: true,
  });

  const orgA = await prisma.organisation.upsert({
    where: { id: "seed-org-harbor" },
    update: { name: "Harbor Fresh Ltd", sector: "Food wholesale", status: "CONTACTED" },
    create: {
      id: "seed-org-harbor",
      name: "Harbor Fresh Ltd",
      sector: "Food wholesale",
      status: "CONTACTED",
      notes: "Fictional contact for discovery",
    },
  });
  const orgB = await prisma.organisation.upsert({
    where: { id: "seed-org-valletta" },
    update: { name: "Valletta Kitchen Co-op Interest", sector: "Hospitality", status: "NURTURE" },
    create: {
      id: "seed-org-valletta",
      name: "Valletta Kitchen Co-op Interest",
      sector: "Hospitality",
      status: "NURTURE",
      notes: "Fictional",
    },
  });
  await prisma.organisation.upsert({
    where: { id: "seed-org-skip" },
    update: { status: "DO_NOT_PURSUE" },
    create: {
      id: "seed-org-skip",
      name: "Skip Logistics Demo",
      sector: "Logistics",
      status: "DO_NOT_PURSUE",
      notes: "Marked do not pursue — fictional",
    },
  });

  const personA = await prisma.person.upsert({
    where: { id: "seed-person-maya" },
    update: {},
    create: {
      id: "seed-person-maya",
      organisationId: orgA.id,
      name: "Maya Camilleri",
      email: "maya@example.invalid",
      roleTitle: "Procurement lead",
      status: "CONTACTED",
    },
  });
  await prisma.person.upsert({
    where: { id: "seed-person-luca" },
    update: {},
    create: {
      id: "seed-person-luca",
      organisationId: orgB.id,
      name: "Luca Bonnici",
      email: "luca@example.invalid",
      roleTitle: "Owner-chef",
      status: "QUALIFIED",
    },
  });

  let template = await prisma.interviewTemplate.findFirst({
    where: { name: "Discovery v1" },
    include: { questions: true },
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
            {
              prompt: "Approximate annual spend (confidential)",
              kind: "CONFIDENTIAL_FINANCIAL",
              order: 2,
            },
          ],
        },
      },
      include: { questions: true },
    });
  }

  const tagSupply = await prisma.problemTag.upsert({
    where: { name: "Supply reliability" },
    update: {},
    create: { name: "Supply reliability" },
  });
  const tagPrice = await prisma.problemTag.upsert({
    where: { name: "Price volatility" },
    update: {},
    create: { name: "Price volatility" },
  });

  const existingInterview = await prisma.interview.findFirst({
    where: { organisationId: orgA.id },
  });
  if (!existingInterview) {
    const interview = await prisma.interview.create({
      data: {
        templateId: template.id,
        organisationId: orgA.id,
        personId: personA.id,
        interviewerId: nesli.id,
        notes: "Fictional discovery interview",
      },
    });
    const qText = template.questions.find((q) => q.kind === "TEXT")!;
    const qTag = template.questions.find((q) => q.kind === "TAG")!;
    const qFin = template.questions.find((q) => q.kind === "CONFIDENTIAL_FINANCIAL")!;
    const a1 = await prisma.interviewAnswer.create({
      data: {
        interviewId: interview.id,
        questionId: qText.id,
        valueText: "Late deliveries disrupt kitchen planning",
      },
    });
    const a2 = await prisma.interviewAnswer.create({
      data: {
        interviewId: interview.id,
        questionId: qTag.id,
        valueText: "Supply reliability",
      },
    });
    await prisma.interviewAnswer.create({
      data: {
        interviewId: interview.id,
        questionId: qFin.id,
        valueNumber: 120000,
        confidential: true,
      },
    });
    await prisma.interviewAnswerTag.createMany({
      data: [
        { answerId: a1.id, tagId: tagSupply.id },
        { answerId: a2.id, tagId: tagSupply.id },
        { answerId: a2.id, tagId: tagPrice.id },
      ],
      skipDuplicates: true,
    });
  }

  await prisma.founderAssessment.createMany({
    data: [
      {
        subjectUserId: founder.id,
        authorId: nesli.id,
        title: "Industry Founder — initial notes",
        positiveNotes:
          "Shows consistent engagement; brings sector contacts; open to evidence-led pace.",
        redFlagPrompts:
          "Explore: Are expectations about registration timelines realistic? Is there pressure to over-promise member savings before assumptions are verified?",
        evidenceNotes: "Based on kick-off conversation notes (fictional seed).",
        status: "DRAFT",
      },
    ],
    skipDuplicates: true,
  });

  const supplier = await prisma.supplier.upsert({
    where: { id: "seed-supplier-med" },
    update: {},
    create: {
      id: "seed-supplier-med",
      name: "MedBulk Supplies",
      category: "Dry goods",
      contact: "sales@example.invalid",
      notes: "Fictional supplier",
    },
  });
  const offerCount = await prisma.supplierOffer.count({ where: { supplierId: supplier.id } });
  if (offerCount === 0) {
    await prisma.supplierOffer.createMany({
      data: [
        {
          supplierId: supplier.id,
          description: "Collective dry goods basket (estimate)",
          unitPrice: 1000,
          currency: "EUR",
          assumptionConfidence: "ESTIMATE",
        },
        {
          supplierId: supplier.id,
          description: "Member-specific pilot price",
          unitPrice: 920,
          currency: "EUR",
          confidentialMemberScope: founder.id,
          assumptionConfidence: "ASSUMPTION",
        },
      ],
    });
  }

  for (const row of [
    {
      key: "discount_pct",
      label: "Expected coop discount",
      value: "8",
      unit: "%",
      confidence: "ESTIMATE" as const,
      scenario: "A",
    },
    {
      key: "discount_pct",
      label: "Expected coop discount",
      value: "12",
      unit: "%",
      confidence: "ASSUMPTION" as const,
      scenario: "B",
    },
    {
      key: "membership_fee",
      label: "Annual membership fee",
      value: "250",
      unit: "EUR",
      confidence: "VERIFIED" as const,
      scenario: "A",
    },
  ]) {
    await prisma.financialAssumption.upsert({
      where: { key_scenario: { key: row.key, scenario: row.scenario } },
      update: row,
      create: row,
    });
  }

  const mv = calculateMemberValue({
    annualSpend: 50000,
    coopDiscountPct: 8,
    membershipFee: 250,
    hoursSaved: 40,
    hourlyValue: 25,
  });
  const mvCount = await prisma.memberValueStatement.count();
  if (mvCount === 0) {
    await prisma.memberValueStatement.create({
      data: {
        memberLabel: "Illustrative member (fictional)",
        inputsJson: {
          annualSpend: 50000,
          coopDiscountPct: 8,
          membershipFee: 250,
          hoursSaved: 40,
          hourlyValue: 25,
        },
        resultJson: mv,
        createdById: nesli.id,
      },
    });
  }

  await prisma.adviceItem.createMany({
    data: [
      {
        category: "Legal",
        title: "Confirm cooperative registration pathway",
        body: "Seek Maltese legal advice before committing to a registration timeline.",
        status: "OPEN",
        adviserId: adviser.id,
      },
    ],
    skipDuplicates: true,
  });

  const meeting = await prisma.meeting.create({
    data: {
      title: "Week 1 kick-off",
      scheduledAt: new Date(),
      location: "Online",
      notes: "Seed meeting",
      attendees: {
        create: [{ userId: nesli.id }, { userId: founder.id }],
      },
    },
  });

  const decisionCount = await prisma.decision.count();
  if (decisionCount === 0) {
    await prisma.decision.create({
      data: {
        meetingId: meeting.id,
        title: "Adopt evidence→gate workflow",
        body: "Programme progression requires evidence and gate criteria (or audited override).",
        decidedById: nesli.id,
      },
    });
  }

  await prisma.risk.createMany({
    data: [
      {
        title: "Over-promising member savings",
        probability: 3,
        impact: 4,
        rating: 12,
        mitigation: "Label all assumptions; avoid promotional certainty.",
        ownerId: nesli.id,
        trigger: "External copy draft without review",
        status: "MITIGATING",
      },
    ],
    skipDuplicates: true,
  });

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

  for (const req of [
    {
      code: "STATUTES_DRAFT",
      title: "Draft statutes",
      description: "Working draft of cooperative statutes",
      priority: "MANDATORY" as const,
    },
    {
      code: "FOUNDER_IDS",
      title: "Founder identification documents",
      description: "Evidence of identity for founding members",
      priority: "MANDATORY" as const,
    },
    {
      code: "BANK_INTRO",
      title: "Bank introduction letter",
      description: "Optional early banking introduction",
      priority: "OPTIONAL" as const,
    },
  ]) {
    await prisma.registrationRequirement.upsert({
      where: { code: req.code },
      update: {
        title: req.title,
        description: req.description,
        priority: req.priority,
        completed: false,
        evidenceDocumentId: null,
      },
      create: req,
    });
  }

  console.log("Seed complete.");
  console.log("Logins: nesli@cooplaunch.mt / founder@cooplaunch.mt / admin@cooplaunch.mt");
  console.log("Password: ChangeMeNow!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
