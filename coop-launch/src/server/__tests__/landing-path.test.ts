import { describe, expect, it } from "vitest";
import type { Role } from "@prisma/client";
import {
  canAccessFounderDashboard,
  canManageProgramme,
  landingPath,
} from "@/server/auth/rbac";
import type { SessionUser } from "@/server/auth/session";

const ROLES = [
  "READ_ONLY",
  "FOUNDING_MEMBER",
  "ADVISER",
  "INDUSTRY_FOUNDER",
  "COORDINATOR",
  "ADMIN",
] as const satisfies readonly Role[];

function user(role: Role): SessionUser {
  return { id: role, email: `${role}@example.test`, name: role, role, active: true };
}

/** Same guards the pages use. Null means the user can stay on that path. */
function bounce(path: string, person: SessionUser): string | null {
  if (path === "/account") {
    const next = landingPath(person);
    return next === "/account" ? null : next;
  }
  if (path === "/founder") {
    return canAccessFounderDashboard(person) ? null : landingPath(person);
  }
  if (path === "/daily-plan" || path === "/dashboard") {
    return canManageProgramme(person) ? null : landingPath(person);
  }
  return null;
}

describe("landing path", () => {
  it("sends coordinators to the main work screen and the industry founder to founder asks", () => {
    expect(landingPath(user("COORDINATOR"))).toBe("/daily-plan");
    expect(landingPath(user("ADMIN"))).toBe("/daily-plan");
    expect(landingPath(user("INDUSTRY_FOUNDER"))).toBe("/founder");
  });

  it("keeps every role on the first page they are sent to", () => {
    for (const role of ROLES) {
      const person = user(role);
      expect(bounce(landingPath(person), person)).toBeNull();
    }
  });

  it("does not send adviser, founding member, or read-only into the founder/dashboard loop", () => {
    for (const role of ["ADVISER", "FOUNDING_MEMBER", "READ_ONLY"] as const) {
      const person = user(role);
      const seen = new Set<string>();
      let path: string | null = landingPath(person);
      for (let hop = 0; hop < 6 && path; hop++) {
        expect(seen.has(path)).toBe(false);
        seen.add(path);
        path = bounce(path, person);
      }
      expect(path).toBeNull();
      expect([...seen]).toEqual(["/account"]);
    }
  });
});
