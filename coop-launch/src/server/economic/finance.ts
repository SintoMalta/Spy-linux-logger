import type { AssumptionConfidence } from "@prisma/client";
import { DomainError } from "@/server/programme/task-service";
import { canSeeMemberPrices } from "@/server/auth/rbac";
import type { SessionUser } from "@/server/auth/session";

export function assertAssumptionConfidence(
  confidence: AssumptionConfidence | string,
): AssumptionConfidence {
  if (
    confidence !== "VERIFIED" &&
    confidence !== "ESTIMATE" &&
    confidence !== "ASSUMPTION"
  ) {
    throw new DomainError(
      "VALIDATION",
      "Financial assumption must be VERIFIED, ESTIMATE, or ASSUMPTION",
    );
  }
  return confidence;
}

export type MemberValueInputs = {
  annualSpend: number;
  coopDiscountPct: number;
  membershipFee: number;
  hoursSaved: number;
  hourlyValue: number;
};

export type MemberValueResult = {
  annualSavings: number;
  timeValue: number;
  netBenefit: number;
  paybackMonths: number | null;
};

export function calculateMemberValue(
  inputs: MemberValueInputs,
): MemberValueResult {
  const annualSavings = inputs.annualSpend * (inputs.coopDiscountPct / 100);
  const timeValue = inputs.hoursSaved * inputs.hourlyValue;
  const netBenefit = annualSavings + timeValue - inputs.membershipFee;
  const paybackMonths =
    inputs.membershipFee <= 0
      ? 0
      : annualSavings + timeValue <= 0
        ? null
        : Math.ceil(
            (inputs.membershipFee / (annualSavings + timeValue)) * 12,
          );
  return { annualSavings, timeValue, netBenefit, paybackMonths };
}

export function filterOffersForRole<
  T extends { confidentialMemberScope: string | null; unitPrice: unknown },
>(offers: T[], user: SessionUser): T[] {
  return offers.map((offer) => {
    if (canSeeMemberPrices(user, offer.confidentialMemberScope)) {
      return offer;
    }
    return { ...offer, unitPrice: null };
  });
}
