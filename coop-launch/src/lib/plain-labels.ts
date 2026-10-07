/** Plain-language labels for statuses shown in the UI. */

const TASK_STATUS: Record<string, string> = {
  NOT_STARTED: "Not started",
  IN_PROGRESS: "In progress",
  BLOCKED: "Blocked",
  ACHIEVED: "Finished",
  CANCELLED: "Cancelled",
};

const STAGE_STATUS: Record<string, string> = {
  NOT_STARTED: "Not started",
  IN_PROGRESS: "This week",
  COMPLETED: "Done",
  BLOCKED: "Blocked",
};

const ORG_STATUS: Record<string, string> = {
  ACTIVE: "Active",
  CONTACTED: "Contacted",
  QUALIFIED: "Interested",
  NURTURE: "Keep in touch",
  DO_NOT_PURSUE: "Do not contact",
  ARCHIVED: "Archived",
};

const ROLE: Record<string, string> = {
  COORDINATOR: "Coordinator",
  INDUSTRY_FOUNDER: "Founder",
  FOUNDING_MEMBER: "Member",
  ADVISER: "Adviser",
  READ_ONLY: "Viewer",
  ADMIN: "Admin",
};

const FOUNDER_ACTION: Record<string, string> = {
  OPEN: "Open",
  DONE: "Done",
  DEFERRED: "Later",
  CANCELLED: "Cancelled",
};

export function plainTaskStatus(v: string) {
  return TASK_STATUS[v] ?? v;
}
export function plainStageStatus(v: string) {
  return STAGE_STATUS[v] ?? v;
}
export function plainOrgStatus(v: string) {
  return ORG_STATUS[v] ?? v;
}
export function plainRole(v: string) {
  return ROLE[v] ?? v;
}
export function plainFounderActionStatus(v: string) {
  return FOUNDER_ACTION[v] ?? v;
}
