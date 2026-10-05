import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import {
  canManageProgramme,
  canSeeConfidentialFinancial,
  canSeeMemberPrices,
  requireRole,
} from "@/server/auth/rbac";
import { AuthError, type SessionUser } from "@/server/auth/session";
import { allDodSatisfied } from "@/server/programme/task-service";
import { evaluateGateCriteria } from "@/server/programme/gate-service";
import { computeReadinessPercent } from "@/server/registration/readiness";
import {
  assertAssumptionConfidence,
  calculateMemberValue,
  filterOffersForRole,
} from "@/server/economic/finance";
import {
  TEMPLATE_BODIES,
  updateDecisionForbidden,
} from "@/server/governance/decisions";
import { stripConfidentialAnswers } from "@/server/market/problem-matrix";

const coord: SessionUser = {
  id: "1",
  email: "c@x",
  name: "C",
  role: "COORDINATOR",
  active: true,
};
const founder: SessionUser = {
  id: "2",
  email: "f@x",
  name: "F",
  role: "INDUSTRY_FOUNDER",
  active: true,
};

describe("password argon2id", () => {
  it("hashes and verifies", async () => {
    const hash = await hashPassword("ChangeMeNow!");
    expect(hash).toContain("argon2");
    expect(await verifyPassword(hash, "ChangeMeNow!")).toBe(true);
    expect(await verifyPassword(hash, "wrong")).toBe(false);
  });
});

describe("rbac", () => {
  it("allows coordinator programme management", () => {
    expect(canManageProgramme(coord)).toBe(true);
    expect(canManageProgramme(founder)).toBe(false);
  });

  it("denies founder confidential financial", () => {
    expect(canSeeConfidentialFinancial(coord)).toBe(true);
    expect(canSeeConfidentialFinancial(founder)).toBe(false);
  });

  it("requireRole throws for wrong role", () => {
    expect(() => requireRole(founder, ["COORDINATOR"])).toThrow(AuthError);
  });

  it("hides member-scoped prices from other founder", () => {
    const offers = [
      { confidentialMemberScope: "other", unitPrice: 10 },
      { confidentialMemberScope: null, unitPrice: 5 },
    ];
    const filtered = filterOffersForRole(offers, founder);
    expect(filtered[0].unitPrice).toBeNull();
    expect(filtered[1].unitPrice).toBe(5);
    expect(canSeeMemberPrices(coord, "other")).toBe(true);
  });
});

describe("definition of done", () => {
  it("blocks when incomplete", () => {
    expect(allDodSatisfied([{ satisfied: false, overridden: false }])).toBe(
      false,
    );
  });
  it("passes when satisfied or overridden", () => {
    expect(
      allDodSatisfied([
        { satisfied: true, overridden: false },
        { satisfied: false, overridden: true },
      ]),
    ).toBe(true);
  });
  it("empty criteria do not pass", () => {
    expect(allDodSatisfied([])).toBe(false);
  });
});

describe("gate engine", () => {
  it("blocks when criteria unmet", () => {
    expect(
      evaluateGateCriteria([{ satisfied: true }, { satisfied: false }], false),
    ).toEqual({ passed: false, blocked: true });
  });
  it("passes with override", () => {
    expect(
      evaluateGateCriteria([{ satisfied: false }], true),
    ).toEqual({ passed: true, blocked: false });
  });
});

describe("registration readiness", () => {
  it("caps below 100 when mandatory blockers exist", () => {
    const result = computeReadinessPercent({
      items: [
        {
          priority: "MANDATORY",
          completed: false,
          evidenceDocumentId: null,
          code: "A",
          title: "A",
        },
        {
          priority: "OPTIONAL",
          completed: true,
          evidenceDocumentId: "d1",
          code: "B",
          title: "B",
        },
      ],
    });
    expect(result.blocked).toBe(true);
    expect(result.percent).toBeLessThan(100);
    expect(result.blockers).toHaveLength(1);
  });

  it("can reach 100 when mandatory complete with evidence", () => {
    const result = computeReadinessPercent({
      items: [
        {
          priority: "MANDATORY",
          completed: true,
          evidenceDocumentId: "d1",
          code: "A",
          title: "A",
        },
      ],
    });
    expect(result.blocked).toBe(false);
    expect(result.percent).toBe(100);
  });
});

describe("economic", () => {
  it("requires assumption labels", () => {
    expect(assertAssumptionConfidence("VERIFIED")).toBe("VERIFIED");
    expect(() => assertAssumptionConfidence("guess")).toThrow();
  });
  it("calculates member value", () => {
    const r = calculateMemberValue({
      annualSpend: 10000,
      coopDiscountPct: 10,
      membershipFee: 100,
      hoursSaved: 10,
      hourlyValue: 20,
    });
    expect(r.annualSavings).toBe(1000);
    expect(r.timeValue).toBe(200);
    expect(r.netBenefit).toBe(1100);
  });
});

describe("governance", () => {
  it("keeps §31–32 template copy exact", () => {
    expect(TEMPLATE_BODIES.SEC31_INTRO).toContain("provisional");
    expect(TEMPLATE_BODIES.SEC32_OUTREACH).toContain("anonymised");
  });
  it("rejects decision updates", async () => {
    await expect(updateDecisionForbidden()).rejects.toThrow(/immutable/i);
  });
});

describe("problem matrix confidentiality", () => {
  it("strips confidential financial for founder role", () => {
    const answers = [
      {
        confidential: true,
        question: { kind: "CONFIDENTIAL_FINANCIAL" },
        valueText: "secret",
        valueNumber: 99,
      },
      {
        confidential: false,
        question: { kind: "TEXT" },
        valueText: "ok",
        valueNumber: null,
      },
    ];
    const stripped = stripConfidentialAnswers(answers, "INDUSTRY_FOUNDER");
    expect(stripped[0].valueText).toBeNull();
    expect(stripped[0].valueNumber).toBeNull();
    expect(stripped[1].valueText).toBe("ok");
  });
});
