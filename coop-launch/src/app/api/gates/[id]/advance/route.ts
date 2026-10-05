import { withMutation } from "@/server/http";
import { advanceStageIfGatePassed } from "@/server/programme/gate-service";

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  return withMutation(request, async (user) => {
    const { id } = await ctx.params;
    return advanceStageIfGatePassed(user, id);
  });
}
