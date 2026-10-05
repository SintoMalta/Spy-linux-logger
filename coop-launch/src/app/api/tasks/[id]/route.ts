import { z } from "zod";
import { withMutation } from "@/server/http";
import { addTaskNote, setDodSatisfied, updateTaskStatus } from "@/server/programme/task-service";

const schema = z.object({
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "WAITING_EXTERNAL", "BLOCKED", "ACHIEVED", "CANCELLED"]).optional(),
  waitingOnPersonId: z.string().optional().nullable(),
  waitingOnOrgId: z.string().optional().nullable(),
  dateRequested: z.string().optional().nullable(),
  followUpDate: z.string().optional().nullable(),
  note: z.string().optional(),
  dodCriterionId: z.string().optional(),
  dodSatisfied: z.boolean().optional(),
});

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  return withMutation(request, async (user) => {
    const { id } = await ctx.params;
    const body = schema.parse(await request.json());
    if (body.note) await addTaskNote(user, id, body.note);
    if (body.dodCriterionId !== undefined && body.dodSatisfied !== undefined) {
      await setDodSatisfied(user, body.dodCriterionId, body.dodSatisfied);
    }
    if (body.status) {
      return updateTaskStatus(user, id, {
        status: body.status,
        waitingOnPersonId: body.waitingOnPersonId,
        waitingOnOrgId: body.waitingOnOrgId,
        dateRequested: body.dateRequested,
        followUpDate: body.followUpDate,
      });
    }
    return { id, updated: true };
  });
}
