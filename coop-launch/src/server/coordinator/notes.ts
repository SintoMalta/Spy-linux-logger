import { prisma } from "@/lib/prisma";
import { AuthError, type SessionUser } from "@/server/auth/session";
import { canManageProgramme } from "@/server/auth/rbac";
import { writeAudit } from "@/server/audit";
import { DomainError } from "@/server/programme/task-service";

function assertCoordinator(user: SessionUser) {
  if (!canManageProgramme(user)) {
    throw new AuthError("FORBIDDEN", "Notes are for the coordinator");
  }
}

export async function listNotes(user: SessionUser, take = 50) {
  assertCoordinator(user);
  return prisma.coordinatorNote.findMany({
    where: { userId: user.id, deletedAt: null },
    orderBy: { updatedAt: "desc" },
    take,
  });
}

export async function createNote(
  user: SessionUser,
  input: { title?: string; body: string },
) {
  assertCoordinator(user);
  const body = input.body.trim();
  if (!body) throw new DomainError("VALIDATION", "Write something before saving");
  const note = await prisma.coordinatorNote.create({
    data: {
      userId: user.id,
      title: (input.title ?? "").trim(),
      body,
    },
  });
  await writeAudit({
    actorId: user.id,
    action: "COORDINATOR_NOTE_CREATED",
    entityType: "CoordinatorNote",
    entityId: note.id,
  });
  return note;
}

export async function updateNote(
  user: SessionUser,
  id: string,
  input: { title?: string; body?: string },
) {
  assertCoordinator(user);
  const existing = await prisma.coordinatorNote.findFirst({
    where: { id, userId: user.id, deletedAt: null },
  });
  if (!existing) throw new DomainError("NOT_FOUND", "Note not found");
  const note = await prisma.coordinatorNote.update({
    where: { id },
    data: {
      title: input.title !== undefined ? input.title.trim() : undefined,
      body: input.body !== undefined ? input.body.trim() : undefined,
    },
  });
  await writeAudit({
    actorId: user.id,
    action: "COORDINATOR_NOTE_UPDATED",
    entityType: "CoordinatorNote",
    entityId: note.id,
  });
  return note;
}

export async function softDeleteNote(user: SessionUser, id: string) {
  assertCoordinator(user);
  const existing = await prisma.coordinatorNote.findFirst({
    where: { id, userId: user.id, deletedAt: null },
  });
  if (!existing) throw new DomainError("NOT_FOUND", "Note not found");
  const note = await prisma.coordinatorNote.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  await writeAudit({
    actorId: user.id,
    action: "COORDINATOR_NOTE_DELETED",
    entityType: "CoordinatorNote",
    entityId: note.id,
  });
  return note;
}
