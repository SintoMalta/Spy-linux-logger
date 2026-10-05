import type { Role } from "@prisma/client";
import { AuthError, type SessionUser } from "./session";

const ROLE_RANK: Record<Role, number> = {
  READ_ONLY: 1,
  FOUNDING_MEMBER: 2,
  ADVISER: 3,
  INDUSTRY_FOUNDER: 4,
  COORDINATOR: 5,
  ADMIN: 6,
};

export function hasRole(user: SessionUser, roles: Role[]): boolean {
  return roles.includes(user.role);
}

export function requireRole(user: SessionUser, roles: Role[]): void {
  if (!hasRole(user, roles)) {
    throw new AuthError("FORBIDDEN", "Insufficient permissions");
  }
}

export function canManageProgramme(user: SessionUser): boolean {
  return hasRole(user, ["COORDINATOR", "ADMIN"]);
}

export function canOverrideGate(user: SessionUser): boolean {
  return hasRole(user, ["COORDINATOR", "ADMIN"]);
}

export function canSeeConfidentialFinancial(user: SessionUser): boolean {
  return hasRole(user, ["COORDINATOR", "ADMIN"]);
}

export function canSeeMemberPrices(
  user: SessionUser,
  memberScope?: string | null,
): boolean {
  if (hasRole(user, ["COORDINATOR", "ADMIN"])) return true;
  if (!memberScope) return true;
  if (user.role === "FOUNDING_MEMBER" && memberScope === user.id) return true;
  if (user.role === "INDUSTRY_FOUNDER" && memberScope === user.id) return true;
  return false;
}

export function canAccessFounderDashboard(user: SessionUser): boolean {
  return hasRole(user, ["INDUSTRY_FOUNDER", "COORDINATOR", "ADMIN"]);
}

export function canWriteCrm(user: SessionUser): boolean {
  return hasRole(user, ["COORDINATOR", "ADMIN"]);
}

export function canCreateDecision(user: SessionUser): boolean {
  return hasRole(user, ["COORDINATOR", "ADMIN"]);
}

export function canAdminUsers(user: SessionUser): boolean {
  return hasRole(user, ["ADMIN"]);
}

export function assertDocumentVisibility(
  user: SessionUser,
  visibility: string,
): void {
  if (visibility === "PUBLIC") return;
  if (visibility === "COORDINATOR" && canManageProgramme(user)) return;
  if (visibility === user.role) return;
  if (user.role === "ADMIN") return;
  throw new AuthError("FORBIDDEN", "Document not visible");
}

export { ROLE_RANK };
