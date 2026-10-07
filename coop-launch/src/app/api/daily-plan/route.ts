import { z } from "zod";
import { withMutation, withSessionJson } from "@/server/http";
import { ensureTodayPlan, proposeNextDayPriorities, saveEndOfDay } from "@/server/programme/daily-plan";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  endOfDayNotes: z.string().optional(),
  items: z
    .array(z.object({ id: z.string(), title: z.string().optional(), done: z.boolean().optional(), minutes: z.number().optional() }))
    .optional(),
  confirmProposals: z.boolean().optional(),
});

export async function GET() {
  return withSessionJson(async (user) => {
    const plan = await ensureTodayPlan(user);
    const proposals = await proposeNextDayPriorities(user);
    return { plan, proposals };
  });
}

export async function PATCH(request: Request) {
  return withMutation(request, async (user) => {
    const body = schema.parse(await request.json());
    const plan = await ensureTodayPlan(user);
    if (body.items) {
      for (const item of body.items) {
        await prisma.dailyPlanItem.update({
          where: { id: item.id },
          data: { title: item.title, done: item.done, minutes: item.minutes },
        });
      }
    }
    if (body.endOfDayNotes !== undefined) {
      await saveEndOfDay(user, plan.id, body.endOfDayNotes);
    }
    // confirmProposals intentionally does not auto-create next day — UI must POST explicit create
    return ensureTodayPlan(user);
  });
}
