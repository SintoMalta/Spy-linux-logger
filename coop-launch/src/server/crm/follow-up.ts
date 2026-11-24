import { DomainError } from "@/server/programme/task-service";

const FOLLOW_UP_LOOKAHEAD_MS = 2 * 86400000;

export type FounderActionStatusName = "OPEN" | "DONE" | "DEFERRED" | "CANCELLED";
export type FounderActionName = "DONE" | "COMMENT" | "CALL_NESLI" | "DEFER";

/** Parse a follow-up date from an API body. Undefined means "leave the stored value". */
export function parseFollowUpDate(value: string | null | undefined): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value.trim() === "") return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new DomainError("VALIDATION", "Follow-up date is not valid");
  }
  return parsed;
}

/** Fields /api/people and /api/organisations still send after the schema strip. */
export function crmFollowUpWrite(input: {
  trade?: string;
  nextAction?: string;
  followUpDate?: string | null;
  potentialFounder?: boolean;
  locality?: string;
}) {
  const followUpDate = parseFollowUpDate(input.followUpDate);
  return {
    ...(input.trade !== undefined ? { trade: input.trade } : {}),
    ...(input.nextAction !== undefined ? { nextAction: input.nextAction } : {}),
    ...(input.followUpDate !== undefined ? { followUpDate } : {}),
    ...(input.potentialFounder !== undefined ? { potentialFounder: input.potentialFounder } : {}),
    ...(input.locality !== undefined ? { locality: input.locality } : {}),
  };
}

export function founderActionResponsePatch(
  existing: {
    status: FounderActionStatusName;
    comment: string | null;
    followUpDate: Date | null;
  },
  response: {
    action: FounderActionName;
    comment?: string;
    followUpDate?: string | null;
  },
) {
  let status: FounderActionStatusName = existing.status;
  if (response.action === "DONE") status = "DONE";
  if (response.action === "DEFER") status = "DEFERRED";
  if (response.action === "COMMENT" || response.action === "CALL_NESLI") status = "OPEN";

  const followUpDate =
    response.followUpDate === undefined
      ? existing.followUpDate
      : (parseFollowUpDate(response.followUpDate) ?? null);

  return {
    status,
    lastAction: response.action,
    comment: response.comment ?? existing.comment,
    followUpDate,
  };
}

/** Contacts whose follow-up is due within the next two days, including overdue. */
export function dueFollowUpWhere(now = new Date()) {
  return {
    deletedAt: null,
    followUpDate: { lte: new Date(now.getTime() + FOLLOW_UP_LOOKAHEAD_MS) },
  };
}
