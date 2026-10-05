import { z } from "zod";
import { withMutation } from "@/server/http";
import { respondToFounderAction } from "@/server/programme/founder-actions";

const schema = z.object({
  action: z.enum(["DONE", "COMMENT", "CALL_NESLI", "DEFER"]),
  comment: z.string().optional(),
  followUpDate: z.string().optional(),
});

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  return withMutation(request, async (user) => {
    const { id } = await ctx.params;
    const body = schema.parse(await request.json());
    return respondToFounderAction(user, id, body);
  });
}
