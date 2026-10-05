import { z } from "zod";
import { withMutation } from "@/server/http";
import { finaliseDecision, updateDecisionForbidden } from "@/server/governance/decisions";

const schema = z.object({ finalise: z.boolean().optional(), title: z.string().optional(), body: z.string().optional() });

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  return withMutation(request, async (user) => {
    const { id } = await ctx.params;
    const body = schema.parse(await request.json());
    if (body.title !== undefined || body.body !== undefined) {
      return updateDecisionForbidden();
    }
    if (body.finalise) return finaliseDecision(user, id);
    return updateDecisionForbidden();
  });
}
