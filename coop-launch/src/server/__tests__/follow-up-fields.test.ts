import { describe, expect, it } from "vitest";
import { OrgPersonStatus, Prisma } from "@prisma/client";
import { DomainError } from "@/server/programme/task-service";
import {
  crmFollowUpWrite,
  dueFollowUpWhere,
  founderActionResponsePatch,
  parseFollowUpDate,
} from "@/server/crm/follow-up";

describe("founder action follow-up date", () => {
  const existing = {
    status: "OPEN" as const,
    comment: null,
    followUpDate: null,
  };

  it("stores the date when a founder ask is deferred", () => {
    const patch = founderActionResponsePatch(existing, {
      action: "DEFER",
      comment: "next week",
      followUpDate: "2030-01-15",
    });
    expect(patch.status).toBe("DEFERRED");
    expect(patch.followUpDate).toEqual(new Date("2030-01-15"));
  });

  it("keeps an existing date when the response does not send one", () => {
    const kept = new Date("2030-02-01");
    const patch = founderActionResponsePatch(
      { ...existing, status: "DEFERRED", followUpDate: kept },
      { action: "DONE", comment: "finished" },
    );
    expect(patch.status).toBe("DONE");
    expect(patch.followUpDate).toEqual(kept);
  });

  it("rejects a follow-up date that is not a date", () => {
    expect(() => parseFollowUpDate("not-a-date")).toThrow(DomainError);
    expect(() =>
      founderActionResponsePatch(existing, { action: "DEFER", followUpDate: "not-a-date" }),
    ).toThrow(DomainError);
  });
});

describe("crm follow-up writes", () => {
  it("keeps trade, next action, date, and founder flag on create", () => {
    const data = crmFollowUpWrite({
      trade: "electrical",
      nextAction: "Call back",
      followUpDate: "2030-01-15",
      potentialFounder: true,
      locality: "Mosta",
    });
    expect(data).toEqual({
      trade: "electrical",
      nextAction: "Call back",
      followUpDate: new Date("2030-01-15"),
      potentialFounder: true,
      locality: "Mosta",
    });
  });

  it("leaves omitted fields unset so an edit does not wipe them", () => {
    expect(crmFollowUpWrite({ nextAction: "Send drawing" })).toEqual({
      nextAction: "Send drawing",
    });
  });

  it("selects contacts due within two days", () => {
    const now = new Date("2030-01-10T00:00:00.000Z");
    const where = dueFollowUpWhere(now);
    expect(where.deletedAt).toBeNull();
    expect(where.followUpDate.lte.toISOString()).toBe("2030-01-12T00:00:00.000Z");
  });
});

describe("prisma follow-up columns", () => {
  it("exposes the columns the contact and founder routes write", () => {
    expect(Prisma.PersonScalarFieldEnum.trade).toBe("trade");
    expect(Prisma.PersonScalarFieldEnum.nextAction).toBe("nextAction");
    expect(Prisma.PersonScalarFieldEnum.followUpDate).toBe("followUpDate");
    expect(Prisma.PersonScalarFieldEnum.potentialFounder).toBe("potentialFounder");
    expect(Prisma.OrganisationScalarFieldEnum.trade).toBe("trade");
    expect(Prisma.OrganisationScalarFieldEnum.locality).toBe("locality");
    expect(Prisma.OrganisationScalarFieldEnum.followUpDate).toBe("followUpDate");
    expect(Prisma.FounderActionRequestScalarFieldEnum.followUpDate).toBe("followUpDate");
    expect(OrgPersonStatus.NEW).toBe("NEW");
    expect(OrgPersonStatus.POTENTIAL_FOUNDER).toBe("POTENTIAL_FOUNDER");
  });
});
