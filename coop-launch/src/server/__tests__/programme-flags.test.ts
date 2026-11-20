import { beforeEach, describe, expect, it, vi } from "vitest";

const upsert = vi.fn();
const writeAudit = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    programmeFlag: {
      upsert: (...args: unknown[]) => upsert(...args),
    },
  },
}));

vi.mock("@/server/audit", () => ({
  writeAudit: (...args: unknown[]) => writeAudit(...args),
}));

import { AuthError, type SessionUser } from "@/server/auth/session";
import { DomainError } from "@/server/programme/task-service";
import {
  markRegistrationSubmitted,
  setWeek9Decision,
} from "@/server/programme/gate-service";

const coordinator: SessionUser = {
  id: "coord-1",
  email: "coord@example.invalid",
  name: "Coordinator",
  role: "COORDINATOR",
  active: true,
};

describe("programme decision flags", () => {
  beforeEach(() => {
    upsert.mockReset();
    writeAudit.mockReset();
    upsert.mockImplementation(async (args: { create: { key: string; value: string } }) => ({
      id: `flag-${args.create.key}`,
      key: args.create.key,
      value: args.create.value,
    }));
  });

  it("stores a NO_GO week 9 decision instead of only writing an audit", async () => {
    const result = await setWeek9Decision(coordinator, "NO_GO");

    expect(upsert).toHaveBeenCalledWith({
      where: { key: "WEEK9_DECISION" },
      update: { value: "NO_GO" },
      create: { key: "WEEK9_DECISION", value: "NO_GO" },
    });
    expect(writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "GO_NO_GO_DECISION",
        entityType: "ProgrammeFlag",
        entityId: "flag-WEEK9_DECISION",
        after: { decision: "NO_GO" },
      }),
    );
    expect(result).toEqual({ decision: "NO_GO", recorded: true });
  });

  it("stores GO and CONDITIONAL_GO on the same flag", async () => {
    await setWeek9Decision(coordinator, "GO");
    await setWeek9Decision(coordinator, "CONDITIONAL_GO");

    expect(upsert).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ update: { value: "GO" } }),
    );
    expect(upsert).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ update: { value: "CONDITIONAL_GO" } }),
    );
  });

  it("refuses a week 9 decision from someone who cannot manage the programme", async () => {
    const reader: SessionUser = { ...coordinator, role: "READ_ONLY" };
    await expect(setWeek9Decision(reader, "GO")).rejects.toBeInstanceOf(AuthError);
    expect(upsert).not.toHaveBeenCalled();
  });

  it("stores verified registration submission and does not infer an unverified one", async () => {
    await expect(markRegistrationSubmitted(coordinator, false)).rejects.toBeInstanceOf(
      DomainError,
    );
    expect(upsert).not.toHaveBeenCalled();

    const result = await markRegistrationSubmitted(coordinator, true);
    expect(upsert).toHaveBeenCalledWith({
      where: { key: "REGISTRATION_SUBMITTED" },
      update: { value: "true" },
      create: { key: "REGISTRATION_SUBMITTED", value: "true" },
    });
    expect(result).toEqual({ verified: true, recorded: true });
  });
});
