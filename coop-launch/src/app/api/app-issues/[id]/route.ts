import { z } from "zod";
import { withMutation } from "@/server/http";
import { updateAppIssueStatus } from "@/server/coordinator/app-issues";

const schema = z.object({
  status: z.enum(["OPEN", "LOOKING", "FIXED"]),
});

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  return withMutation(request, async (user) => {
    const { id } = await ctx.params;
    const body = schema.parse(await request.json());
    return updateAppIssueStatus(user, id, body.status);
  });
}
