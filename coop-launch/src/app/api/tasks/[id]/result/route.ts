import { z } from "zod";
import { withMutation } from "@/server/http";
import { prisma } from "@/lib/prisma";
import { canManageProgramme } from "@/server/auth/rbac";
import { AuthError } from "@/server/auth/session";
import { DomainError } from "@/server/programme/task-service";
import { writeAudit } from "@/server/audit";

const schema = z.object({
  resultNotes: z.string(),
});

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  return withMutation(request, async (user) => {
    if (!canManageProgramme(user)) {
      throw new AuthError("FORBIDDEN", "Only the coordinator can save task results");
    }
    const { id } = await ctx.params;
    const body = schema.parse(await request.json());
    const existing = await prisma.task.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new DomainError("NOT_FOUND", "Task not found");

    // If task was not started, move to in progress when result is saved
    const nextStatus =
      existing.status === "NOT_STARTED" || existing.status === "ACHIEVED"
        ? existing.status === "ACHIEVED"
          ? existing.status
          : "IN_PROGRESS"
        : existing.status;

    const updated = await prisma.task.update({
      where: { id },
      data: {
        resultNotes: body.resultNotes,
        status: nextStatus,
      },
    });
    await writeAudit({
      actorId: user.id,
      action: "TASK_RESULT_SAVED",
      entityType: "Task",
      entityId: id,
      after: { resultNotesLength: body.resultNotes.length, status: updated.status },
    });
    return updated;
  });
}
