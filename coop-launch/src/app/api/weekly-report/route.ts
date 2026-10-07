import { z } from "zod";
import { withMutation, withSessionJson } from "@/server/http";
import { buildWeeklyReportDraft, upsertWeeklyReport } from "@/server/programme/weekly-report";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  weekNumber: z.number().int().min(1).max(12),
  body: z.string().optional(),
  prefill: z.boolean().optional(),
  finalise: z.boolean().optional(),
});

export async function GET(request: Request) {
  return withSessionJson(async () => {
    const week = Number(new URL(request.url).searchParams.get("week") ?? "1");
    return prisma.weeklyReport.findMany({ where: { weekNumber: week }, orderBy: { createdAt: "desc" } });
  });
}

export async function POST(request: Request) {
  return withMutation(request, async (user) => {
    const body = schema.parse(await request.json());
    const text =
      body.body ??
      (body.prefill ? await buildWeeklyReportDraft(user, body.weekNumber) : "");
    return upsertWeeklyReport(user, body.weekNumber, text, Boolean(body.finalise));
  });
}
