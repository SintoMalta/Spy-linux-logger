import { prisma } from "@/lib/prisma";
import { AuthError, type SessionUser } from "@/server/auth/session";
import { canManageProgramme } from "@/server/auth/rbac";
import { writeAudit } from "@/server/audit";
import type { OrgPersonStatus } from "@prisma/client";
import { DomainError } from "@/server/programme/task-service";

export async function createOrganisation(
  user: SessionUser,
  input: {
    name: string;
    sector?: string;
    status?: OrgPersonStatus;
    notes?: string;
  },
) {
  if (!canManageProgramme(user)) {
    throw new AuthError("FORBIDDEN", "Only coordinators can create organisations");
  }
  const name = input.name.trim();
  if (!name) throw new DomainError("VALIDATION", "Organisation name is required");

  const org = await prisma.organisation.create({
    data: {
      name,
      sector: input.sector?.trim() || "",
      status: input.status ?? "ACTIVE",
      notes: input.notes?.trim() || "",
    },
  });
  await writeAudit({
    actorId: user.id,
    action: "ORG_CREATED",
    entityType: "Organisation",
    entityId: org.id,
    after: { name: org.name, status: org.status },
  });
  return org;
}

export async function createPerson(
  user: SessionUser,
  input: {
    name: string;
    organisationId?: string;
    email?: string;
    phone?: string;
    roleTitle?: string;
    status?: OrgPersonStatus;
  },
) {
  if (!canManageProgramme(user)) {
    throw new AuthError("FORBIDDEN", "Only coordinators can create people");
  }
  const name = input.name.trim();
  if (!name) throw new DomainError("VALIDATION", "Person name is required");

  if (input.organisationId) {
    const org = await prisma.organisation.findFirst({
      where: { id: input.organisationId, deletedAt: null },
    });
    if (!org) throw new DomainError("NOT_FOUND", "Organisation not found");
  }

  const person = await prisma.person.create({
    data: {
      name,
      organisationId: input.organisationId || null,
      email: input.email?.trim() || null,
      phone: input.phone?.trim() || null,
      roleTitle: input.roleTitle?.trim() || null,
      status: input.status ?? "ACTIVE",
    },
  });
  await writeAudit({
    actorId: user.id,
    action: "PERSON_CREATED",
    entityType: "Person",
    entityId: person.id,
    after: { name: person.name, organisationId: person.organisationId },
  });
  return person;
}
