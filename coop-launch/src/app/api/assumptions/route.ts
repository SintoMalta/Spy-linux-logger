import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withMutation, withSessionJson } from "@/server/http";
import { canManageProgramme } from "@/server/auth/rbac";
import { AuthError } from "@/server/auth/session";
import { assertAssumptionConfidence } from "@/server/economic/finance";
import { writeAudit } from "@/server/audit";

const schema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  value: z.string().min(1),
  unit: z.string().optional().nullable(),
  confidence: z.enum(["VERIFIED", "ESTIMATE", "ASSUMPTION"]),
  scenario: z.enum(["CONSERVATIVE", "BASE", "UPSIDE"]),
  notes: z.string().optional(),
});

export async function GET() {
  return withSessionJson(async (user) => {
    if (!canManageProgramme(user)) throw new AuthError("FORBIDDEN", "Insufficient permissions");
    return prisma.financialAssumption.findMany({
      where: { deletedAt: null },
      orderBy: [{ scenario: "asc" }, { key: "asc" }],
    });
  });
}

export async function POST(request: Request) {
  return withMutation(request, async (user) => {
    if (!canManageProgramme(user)) throw new AuthError("FORBIDDEN", "Insufficient permissions");
    const body = schema.parse(await request.json());
    assertAssumptionConfidence(body.confidence);
    const row = await prisma.financialAssumption.upsert({
      where: { key_scenario: { key: body.key, scenario: body.scenario } },
      update: {
        label: body.label,
        value: body.value,
        unit: body.unit,
        confidence: body.confidence,
        notes: body.notes ?? "",
        deletedAt: null,
      },
      create: {
        key: body.key,
        label: body.label,
        value: body.value,
        unit: body.unit,
        confidence: body.confidence,
        scenario: body.scenario,
        notes: body.notes ?? "",
      },
    });
    await writeAudit({ actorId: user.id, action: "ASSUMPTION_UPSERT", entityType: "FinancialAssumption", entityId: row.id, after: body });
    return row;
  });
}
