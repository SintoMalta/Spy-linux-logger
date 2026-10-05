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
  evaluateGateCriteria,
  getGateEvaluation,
  overrideGate,
} from "@/server/programme/gate-service";

const prisma = new PrismaClient();

const hasDb = Boolean(process.env.DATABASE_URL);

describe.runIf(hasDb)("auth integration", () => {
  const email = `test-auth-${Date.now()}@example.invalid`;
  let userId = "";

  beforeAll(async () => {
    const passwordHash = await hashPassword("TestPass123!");
    const user = await prisma.user.create({
      data: {
        email,
        name: "Auth Tester",
        role: "COORDINATOR",
        passwordHash,
      },
    });
    userId = user.id;
  });

  it("creates and resolves sessions", async () => {
    const token = await createSession(userId);
    const sessionUser = await getSessionUser(token);
    expect(sessionUser?.email).toBe(email);
    await revokeSession(token);
    expect(await getSessionUser(token)).toBeNull();
  });

  it("logs in with password", async () => {
    const result = await loginWithPassword(email, "TestPass123!", {
      ip: "10.0.0.1",
    });
    expect(result.user.id).toBe(userId);
  });

  it("rate limits after threshold", async () => {
    const ip = `10.9.${Date.now() % 200}.2`;
    for (let i = 0; i < 10; i++) {
      await recordLoginAttempt(email, ip, false);
    }
    expect(await isRateLimited(email, ip)).toBe(true);
    await expect(
      loginWithPassword(email, "wrong", { ip }),
    ).rejects.toBeInstanceOf(AuthError);
  });
});

describe.runIf(hasDb)("gate + DoD integration", () => {
  it("blocks ACHIEVED without DoD and allows override", async () => {
    const passwordHash = await hashPassword("x");
    const user = await prisma.user.create({
      data: {
        email: `dod-${Date.now()}@example.invalid`,
        name: "DoD",
        role: "COORDINATOR",
        passwordHash,
      },
    });
    const maxWeek = await prisma.stage.aggregate({ _max: { weekNumber: true } });
    const weekNumber = (maxWeek._max.weekNumber ?? 100) + 1;
    const stage = await prisma.stage.create({
      data: {
        weekNumber,
        title: "Test stage",
        description: "test",
        order: weekNumber,
      },
    });
    const task = await prisma.task.create({
      data: {
        stageId: stage.id,
        title: "DoD task",
        dodCriteria: {
          create: [{ label: "Need evidence", satisfied: false }],
        },
      },
      include: { dodCriteria: true },
    });

    await expect(
      markTaskAchieved(
        { id: user.id, email: user.email, name: user.name, role: user.role, active: true },
        task.id,
      ),
    ).rejects.toThrow(/Definition of Done/);

    const achieved = await markTaskAchieved(
      { id: user.id, email: user.email, name: user.name, role: user.role, active: true },
      task.id,
      { overrideReason: "Authorised test override" },
    );
    expect(achieved.status).toBe("ACHIEVED");
  });

  it("audits gate overrides", async () => {
    const passwordHash = await hashPassword("x");
    const user = await prisma.user.create({
      data: {
        email: `gate-${Date.now()}@example.invalid`,
        name: "Gate",
        role: "COORDINATOR",
        passwordHash,
      },
    });
    const maxWeek = await prisma.stage.aggregate({ _max: { weekNumber: true } });
    const weekNumber = (maxWeek._max.weekNumber ?? 200) + 1;
    const stage = await prisma.stage.create({
      data: {
        weekNumber,
        title: "Gate stage",
        description: "test",
        order: weekNumber,
      },
    });
    const gate = await prisma.gate.create({
      data: {
        stageId: stage.id,
        title: "Test gate",
        criteria: {
          create: [
            { type: "BOOLEAN", label: "Must be true", satisfied: false },
          ],
        },
      },
    });

    const evalBlocked = await getGateEvaluation(gate.id);
    expect(evalBlocked.evaluation.blocked).toBe(true);
    expect(evaluateGateCriteria([{ satisfied: false }], false).blocked).toBe(
      true,
    );

    await overrideGate(
      { id: user.id, email: user.email, name: user.name, role: user.role, active: true },
      gate.id,
      "Emergency progression for test",
    );
    const after = await getGateEvaluation(gate.id);
    expect(after.evaluation.passed).toBe(true);

    const audit = await prisma.auditLog.findFirst({
      where: { entityId: gate.id, action: "GATE_OVERRIDE" },
    });
    expect(audit).toBeTruthy();
  });
});
