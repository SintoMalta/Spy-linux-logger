import { prisma } from "@/lib/prisma";
import type { GateCriterion, GateMetricKey } from "@prisma/client";

export type MetricSnapshot = {
  interviewCount: number;
  problemTagCount: number;
  founderCandidateCount: number;
  supplierDiscussionCount: number;
  supplierOfferCount: number;
  adviceOpenCount: number;
  organisationCount: number;
  week9Decision: string | null;
  registrationSubmitted: boolean;
};

export async function collectMetrics(): Promise<MetricSnapshot> {
  const [
    interviewCount,
    problemTagCount,
    founderCandidateCount,
    supplierDiscussionCount,
    supplierOfferCount,
    adviceOpenCount,
    organisationCount,
    week9,
    regSubmitted,
  ] = await Promise.all([
    prisma.interview.count({ where: { deletedAt: null, status: "COMPLETED" } }),
    prisma.problemTag.count({
      where: { answers: { some: { answer: { interview: { status: "COMPLETED", deletedAt: null } } } } },
    }),
    prisma.person.count({
      where: {
        deletedAt: null,
        OR: [
          { potentialFounder: true },
          { status: { in: ["POTENTIAL_FOUNDER", "FOUNDING_WORKING_GROUP"] } },
        ],
      },
    }),
    prisma.supplierDiscussion.count(),
    prisma.supplierOffer.count({ where: { deletedAt: null } }),
    prisma.adviceItem.count({
      where: { deletedAt: null, status: { in: ["OPEN", "AWAITING_RESPONSE", "FOLLOW_UP_REQUIRED"] } },
    }),
    prisma.organisation.count({ where: { deletedAt: null } }),
    prisma.programmeFlag.findUnique({ where: { key: "WEEK9_DECISION" } }),
    prisma.programmeFlag.findUnique({ where: { key: "REGISTRATION_SUBMITTED" } }),
  ]);

  return {
    interviewCount,
    problemTagCount,
    founderCandidateCount,
    supplierDiscussionCount,
    supplierOfferCount,
    adviceOpenCount,
    organisationCount,
    week9Decision: week9?.value ?? null,
    registrationSubmitted: regSubmitted?.value === "true",
  };
}

export function metricValue(
  key: GateMetricKey,
  metrics: MetricSnapshot,
): number | boolean | string | null {
  switch (key) {
    case "INTERVIEW_COUNT":
      return metrics.interviewCount;
    case "PROBLEM_TAG_COUNT":
      return metrics.problemTagCount;
    case "FOUNDER_CANDIDATE_COUNT":
      return metrics.founderCandidateCount;
    case "SUPPLIER_DISCUSSION_COUNT":
      return metrics.supplierDiscussionCount;
    case "SUPPLIER_OFFER_COUNT":
      return metrics.supplierOfferCount;
    case "ADVICE_OPEN_COUNT":
      return metrics.adviceOpenCount;
    case "ORGANISATION_COUNT":
      return metrics.organisationCount;
    case "WEEK9_DECISION":
      return metrics.week9Decision;
    case "REGISTRATION_SUBMITTED":
      return metrics.registrationSubmitted;
    default:
      return null;
  }
}

export function evaluateCriterionAgainstMetrics(
  criterion: Pick<GateCriterion, "type" | "targetValue" | "metricKey" | "satisfied" | "code">,
  metrics: MetricSnapshot,
  extras?: {
    hasDocument?: boolean;
    hasReview?: boolean;
    hasExternalAnswer?: boolean;
  },
): { satisfied: boolean; evidenceNote: string } {
  const extrasSafe = extras ?? {};
  switch (criterion.type) {
    case "NUMERIC_MIN": {
      const raw = metricValue(criterion.metricKey, metrics);
      const n = typeof raw === "number" ? raw : Number(raw ?? 0);
      const target = criterion.targetValue ?? 0;
      return {
        satisfied: n >= target,
        evidenceNote: `${criterion.metricKey}=${n} (need ≥ ${target})`,
      };
    }
    case "BOOLEAN": {
      if (criterion.metricKey === "REGISTRATION_SUBMITTED") {
        return {
          satisfied: metrics.registrationSubmitted,
          evidenceNote: `registrationSubmitted=${metrics.registrationSubmitted}`,
        };
      }
      if (criterion.metricKey === "WEEK9_DECISION") {
        const ok =
          metrics.week9Decision === "GO" ||
          metrics.week9Decision === "CONDITIONAL_GO";
        return {
          satisfied: ok,
          evidenceNote: `week9Decision=${metrics.week9Decision ?? "unset"}`,
        };
      }
      return {
        satisfied: criterion.satisfied,
        evidenceNote: "manual boolean",
      };
    }
    case "REQUIRED_DOCUMENT":
      return {
        satisfied: Boolean(extrasSafe.hasDocument),
        evidenceNote: extrasSafe.hasDocument ? "document linked" : "document missing",
      };
    case "REQUIRED_REVIEW":
      return {
        satisfied: Boolean(extrasSafe.hasReview),
        evidenceNote: extrasSafe.hasReview ? "review present" : "review missing",
      };
    case "REQUIRED_EXTERNAL_ANSWER":
      return {
        satisfied: Boolean(extrasSafe.hasExternalAnswer),
        evidenceNote: extrasSafe.hasExternalAnswer
          ? "external answer recorded"
          : "awaiting external answer",
      };
    case "MANUAL_APPROVAL":
      return {
        satisfied: criterion.satisfied,
        evidenceNote: criterion.satisfied ? "manually approved" : "awaiting manual approval",
      };
    default:
      return { satisfied: false, evidenceNote: "unknown type" };
  }
}
