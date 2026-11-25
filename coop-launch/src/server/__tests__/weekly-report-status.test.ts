import { describe, expect, it } from "vitest";
import { Prisma } from "@prisma/client";
import {
  weeklyReportDraftWhere,
  weeklyReportPersist,
} from "@/server/programme/weekly-report-status";

describe("weekly report status", () => {
  const now = new Date("2030-06-01T12:00:00.000Z");

  it("keeps a saved report as a draft and does not publish it", () => {
    expect(weeklyReportPersist("Week notes", false, now)).toEqual({
      body: "Week notes",
      status: "DRAFT",
      publishedAt: null,
    });
  });

  it("publishes the report when it is finalised", () => {
    expect(weeklyReportPersist("Week notes", true, now)).toEqual({
      body: "Week notes",
      status: "FINAL",
      publishedAt: now,
    });
  });

  it("only reloads a draft, so a later save does not overwrite a final report", () => {
    expect(weeklyReportDraftWhere("user-1", 4)).toEqual({
      weekNumber: 4,
      authoredById: "user-1",
      status: "DRAFT",
    });
  });

  it("exposes the status column the weekly report route writes", () => {
    expect(Prisma.WeeklyReportScalarFieldEnum.status).toBe("status");
  });
});
