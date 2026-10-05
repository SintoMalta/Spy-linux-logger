import { beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "@/server/auth/password";
import {
  createSession,
  getSessionUser,
  isRateLimited,
  loginWithPassword,
  recordLoginAttempt,
  revokeSession,
  AuthError,
} from "@/server/auth/session";
import { markTaskAchieved } from "@/server/programme/task-service";
import {
  autoEvaluateGate,
  evaluateGateCriteria,
  getGateEvaluation,
  overrideGate,
  setWeek9Decision,
  markRegistrationSubmitted,
} from "@/server/programme/gate-service";
import { assertValidOrigin, OriginError, clientIp } from "@/server/security/origin";
import { stripConfidentialAnswers } from "@/server/market/problem-matrix";
import { respondToFounderAction } from "@/server/programme/founder-actions";
import { computeReadinessPercent } from "@/server/registration/readiness";
import { putObject, getObject, sha256Buffer } from "@/server/storage/s3";
import { spawnSync } from "child_process";
import path from "path";

const prisma = new PrismaClient();
const hasDb = Boolean(process.env.DATABASE_URL);

describe.runIf(hasDb)("auth integration", () => {
  const email = `test-auth-${Date.now()}@example.invalid`;
  let userId = "";

  beforeAll(async () => {
    const passwordHash = await hashPassword("TestPass123!");
    const user = await prisma.user.create({
      data: { email, name: "Auth Tester", role: "COORDINATOR", passwordHash },
    });
    userId = user.id;
  });

  it("creates and resolves sessions", async () => {
    const token = await createSession(userId);
    expect((await getSessionUser(token))?.email).toBe(email);
    await revokeSession(token);
    expect(await getSessionUser(token)).toBeNull();
  });

  it("logs in with password", async () => {
    const result = await loginWithPassword(email, "TestPass123!", { ip: "10.0.0.1" });
    expect(result.user.id).toBe(userId);
  });

  it("rate limits after threshold", async () => {
    const ip = `10.9.${Date.now() % 200}.2`;
    for (let i = 0; i < 10; i++) await recordLoginAttempt(email, ip, false);
    expect(await isRateLimited(email, ip)).toBe(true);
    await expect(loginWithPassword(email, "wrong", { ip })).rejects.toBeInstanceOf(AuthError);
  });
});

describe("origin + proxy IP", () => {
  it("rejects invalid Origin", () => {
    const req = new Request("http://localhost:3000/api/x", {
      method: "POST",
      headers: { origin: "https://evil.example" },
    });
    expect(() => assertValidOrigin(req)).toThrow(OriginError);
  });

  it("allows APP_URL origin", () => {
    process.env.APP_URL = "http://localhost:3000";
    const req = new Request("http://localhost:3000/api/x", {
      method: "POST",
      headers: { origin: "http://localhost:3000" },
    });
    expect(() => assertValidOrigin(req)).not.toThrow();
  });

  it("ignores x-forwarded-for unless TRUST_PROXY", () => {
    process.env.TRUST_PROXY = "false";
    const req = new Request("http://localhost:3000/api/x", {
      headers: { "x-forwarded-for": "9.9.9.9" },
    });
    expect(clientIp(req)).toBe("127.0.0.1");
    process.env.TRUST_PROXY = "true";
    expect(clientIp(req)).toBe("9.9.9.9");
    process.env.TRUST_PROXY = "false";
  });
});

describe("prod seed refuse", () => {
  it("seed script exits non-zero in production without ALLOW_DEMO_SEED", () => {
    const result = spawnSync(
      "pnpm",
      ["exec", "tsx", "prisma/seed.ts"],
      {
        cwd: path.join(__dirname, "../../.."),
        env: { ...process.env, NODE_ENV: "production", ALLOW_DEMO_SEED: "" },
        encoding: "utf8",
      },
    );
    expect(result.status).not.toBe(0);
    expect(result.stderr + result.stdout).toMatch(/Refusing demo seed/i);
  });
});

describe.runIf(hasDb)("journeys", () => {
  it("contact → interview → problem matrix path", async () => {
    const passwordHash = await hashPassword("x");
    const coord = await prisma.user.create({
      data: {
        email: `j-int-${Date.now()}@example.invalid`,
        name: "Coord",
        role: "COORDINATOR",
        passwordHash,
      },
    });
    const org = await prisma.organisation.create({
      data: { name: "Journey Org (FICTIONAL)", trade: "electrical", status: "CONTACTED" },
    });
    const person = await prisma.person.create({
      data: { name: "Journey Person", organisationId: org.id, trade: "electrical", status: "INTERVIEWED" },
    });
    const template = await prisma.interviewTemplate.create({
      data: {
        name: `Journey template ${Date.now()}`,
        questions: {
          create: [
            { prompt: "Pain?", kind: "TEXT", order: 0, topic: "purchasing" },
            { prompt: "Tag", kind: "TAG", order: 1, topic: "tags" },
            { prompt: "Spend", kind: "CONFIDENTIAL_FINANCIAL", order: 2, topic: "capital" },
          ],
        },
      },
      include: { questions: true },
    });
    const interview = await prisma.interview.create({
      data: {
        templateId: template.id,
        organisationId: org.id,
        personId: person.id,
        interviewerId: coord.id,
        status: "COMPLETED",
      },
    });
    const tag = await prisma.problemTag.upsert({
      where: { name: "Journey payment delays" },
      update: {},
      create: { name: "Journey payment delays" },
    });
    const qTag = template.questions.find((q) => q.kind === "TAG")!;
    const answer = await prisma.interviewAnswer.create({
      data: { interviewId: interview.id, questionId: qTag.id, valueText: tag.name },
    });
    await prisma.interviewAnswerTag.create({ data: { answerId: answer.id, tagId: tag.id } });

    const count = await prisma.interviewAnswerTag.count({
      where: { tagId: tag.id, answer: { interview: { status: "COMPLETED" } } },
    });
    expect(count).toBeGreaterThan(0);
  });

  it("auto-evaluates founder candidate gate metric", async () => {
    const passwordHash = await hashPassword("x");
    const coord = await prisma.user.create({
      data: {
        email: `j-founders-${Date.now()}@example.invalid`,
        name: "Coord",
        role: "COORDINATOR",
        passwordHash,
      },
    });
    await prisma.person.create({
      data: { name: "PF", potentialFounder: true, status: "POTENTIAL_FOUNDER" },
    });
    const maxWeek = await prisma.stage.aggregate({ _max: { weekNumber: true } });
    const weekNumber = (maxWeek._max.weekNumber ?? 300) + 1;
    const stage = await prisma.stage.create({
      data: { weekNumber, title: "Founders gate test", description: "", order: weekNumber },
    });
    const gate = await prisma.gate.create({
      data: {
        stageId: stage.id,
        title: "Founders",
        criteria: {
          create: [
            {
              type: "NUMERIC_MIN",
              label: "≥1 founder candidate",
              targetValue: 1,
              metricKey: "FOUNDER_CANDIDATE_COUNT",
            },
          ],
        },
      },
    });
    const evalResult = await autoEvaluateGate(gate.id);
    expect(evalResult.evaluation.passed).toBe(true);
    void coord;
  });

  it("supplier gate auto-eval and advice CRUD status", async () => {
    const passwordHash = await hashPassword("x");
    const coord = await prisma.user.create({
      data: {
        email: `j-sup-${Date.now()}@example.invalid`,
        name: "Coord",
        role: "COORDINATOR",
        passwordHash,
      },
    });
    const supplier = await prisma.supplier.create({
      data: { name: "Journey Supplier (FICTIONAL)", category: "materials" },
    });
    await prisma.supplierDiscussion.create({
      data: { supplierId: supplier.id, userId: coord.id, summary: "talk" },
    });
    await prisma.supplierOffer.create({
      data: {
        supplierId: supplier.id,
        description: "offer",
        assumptionConfidence: "ESTIMATE",
      },
    });
    const maxWeek = await prisma.stage.aggregate({ _max: { weekNumber: true } });
    const weekNumber = (maxWeek._max.weekNumber ?? 400) + 1;
    const stage = await prisma.stage.create({
      data: { weekNumber, title: "Supplier gate", description: "", order: weekNumber },
    });
    const gate = await prisma.gate.create({
      data: {
        stageId: stage.id,
        title: "Supplier",
        criteria: {
          create: [
            {
              type: "NUMERIC_MIN",
              label: "discussions",
              targetValue: 1,
              metricKey: "SUPPLIER_DISCUSSION_COUNT",
            },
            {
              type: "NUMERIC_MIN",
              label: "offers",
              targetValue: 1,
              metricKey: "SUPPLIER_OFFER_COUNT",
            },
          ],
        },
      },
    });
    const result = await autoEvaluateGate(gate.id);
    expect(result.evaluation.passed).toBe(true);

    const advice = await prisma.adviceItem.create({
      data: {
        category: "Legal",
        title: "Journey advice",
        body: "body",
        status: "AWAITING_RESPONSE",
      },
    });
    const updated = await prisma.adviceItem.update({
      where: { id: advice.id },
      data: { status: "ANSWERED", responseNotes: "ok" },
    });
    expect(updated.status).toBe("ANSWERED");
  });

  it("registration evidence blockers and gate override audit", async () => {
    const readiness = computeReadinessPercent({
      items: [
        {
          priority: "MANDATORY",
          completed: true,
          evidenceDocumentId: null,
          code: "IDS",
          title: "IDs",
        },
      ],
    });
    expect(readiness.blocked).toBe(true);
    expect(readiness.percent).toBeLessThan(100);

    const passwordHash = await hashPassword("x");
    const coord = await prisma.user.create({
      data: {
        email: `j-gate-${Date.now()}@example.invalid`,
        name: "Coord",
        role: "COORDINATOR",
        passwordHash,
      },
    });
    const maxWeek = await prisma.stage.aggregate({ _max: { weekNumber: true } });
    const weekNumber = (maxWeek._max.weekNumber ?? 500) + 1;
    const stage = await prisma.stage.create({
      data: { weekNumber, title: "Override stage", description: "", order: weekNumber },
    });
    const gate = await prisma.gate.create({
      data: {
        stageId: stage.id,
        title: "Override gate",
        criteria: {
          create: [{ type: "BOOLEAN", label: "Hard", satisfied: false, metricKey: "NONE" }],
        },
      },
    });
    expect((await getGateEvaluation(gate.id)).evaluation.blocked).toBe(true);
    await overrideGate(
      { id: coord.id, email: coord.email, name: coord.name, role: coord.role, active: true },
      gate.id,
      "Audited journey override",
    );
    const audit = await prisma.auditLog.findFirst({
      where: { entityId: gate.id, action: "GATE_OVERRIDE" },
    });
    expect(audit).toBeTruthy();
    expect(evaluateGateCriteria([{ satisfied: false }], true).passed).toBe(true);
  });

  it("founder cannot see confidential finance fields", () => {
    const stripped = stripConfidentialAnswers(
      [
        {
          confidential: true,
          question: { kind: "CONFIDENTIAL_FINANCIAL" },
          valueText: "secret",
          valueNumber: 42,
        },
      ],
      "INDUSTRY_FOUNDER",
    );
    expect(stripped[0].valueText).toBeNull();
    expect(stripped[0].valueNumber).toBeNull();
  });

  it("founder action response journey", async () => {
    const passwordHash = await hashPassword("x");
    const founder = await prisma.user.create({
      data: {
        email: `j-fa-${Date.now()}@example.invalid`,
        name: "Founder",
        role: "INDUSTRY_FOUNDER",
        passwordHash,
      },
    });
    const coord = await prisma.user.create({
      data: {
        email: `j-fa-c-${Date.now()}@example.invalid`,
        name: "Coord",
        role: "COORDINATOR",
        passwordHash,
      },
    });
    const action = await prisma.founderActionRequest.create({
      data: {
        title: "Call intro",
        kind: "INTRODUCTION",
        assigneeId: founder.id,
        createdById: coord.id,
      },
    });
    const updated = await respondToFounderAction(
      { id: founder.id, email: founder.email, name: founder.name, role: founder.role, active: true },
      action.id,
      { action: "DEFER", comment: "next week", followUpDate: "2030-01-15" },
    );
    expect(updated.status).toBe("DEFERRED");
    expect(updated.followUpDate).toBeTruthy();
  });

  it("week9 NO_GO and registration submitted never auto", async () => {
    const passwordHash = await hashPassword("x");
    const coord = await prisma.user.create({
      data: {
        email: `j-w9-${Date.now()}@example.invalid`,
        name: "Coord",
        role: "COORDINATOR",
        passwordHash,
      },
    });
    const sessionUser = {
      id: coord.id,
      email: coord.email,
      name: coord.name,
      role: coord.role,
      active: true,
    };
    await setWeek9Decision(sessionUser, "NO_GO");
    const flag = await prisma.programmeFlag.findUnique({ where: { key: "WEEK9_DECISION" } });
    expect(flag?.value).toBe("NO_GO");
    await markRegistrationSubmitted(sessionUser, true);
    const submitted = await prisma.programmeFlag.findUnique({
      where: { key: "REGISTRATION_SUBMITTED" },
    });
    expect(submitted?.value).toBe("true");
  });

  it("DoD achieve still enforced", async () => {
    const passwordHash = await hashPassword("x");
    const user = await prisma.user.create({
      data: {
        email: `j-dod-${Date.now()}@example.invalid`,
        name: "DoD",
        role: "COORDINATOR",
        passwordHash,
      },
    });
    const maxWeek = await prisma.stage.aggregate({ _max: { weekNumber: true } });
    const weekNumber = (maxWeek._max.weekNumber ?? 600) + 1;
    const stage = await prisma.stage.create({
      data: { weekNumber, title: "DoD", description: "", order: weekNumber },
    });
    const task = await prisma.task.create({
      data: {
        stageId: stage.id,
        title: "DoD task",
        dodCriteria: { create: [{ label: "Need evidence", satisfied: false }] },
      },
    });
    const sessionUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      active: true,
    };
    await expect(markTaskAchieved(sessionUser, task.id)).rejects.toThrow(/Definition of Done/);
    const achieved = await markTaskAchieved(sessionUser, task.id, {
      overrideReason: "Authorised",
    });
    expect(achieved.status).toBe("ACHIEVED");
  });
});

describe("storage fs backup integrity", () => {
  it("put/get object roundtrip with sha256", async () => {
    process.env.S3_DRIVER = "fs";
    const body = Buffer.from("coop-launch-backup-demo");
    const key = `demo/${Date.now()}.txt`;
    await putObject({
      bucket: "coop-launch-backups",
      key,
      body,
      contentType: "text/plain",
    });
    const got = await getObject({ bucket: "coop-launch-backups", key });
    expect(sha256Buffer(got)).toBe(sha256Buffer(body));
  });
});
