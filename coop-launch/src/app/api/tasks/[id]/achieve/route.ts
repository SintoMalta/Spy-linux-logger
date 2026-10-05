import { z } from "zod";
import { withMutation } from "@/server/http";
import { markTaskAchieved } from "@/server/programme/task-service";

const schema = z.object({ overrideReason: z.string().optional() });

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  return withMutation(request, async (user) => {
    const { id } = await ctx.params;
    const body = schema.parse(await request.json().catch(() => ({})));
    return markTaskAchieved(user, id, { overrideReason: body.overrideReason });
  });
}
