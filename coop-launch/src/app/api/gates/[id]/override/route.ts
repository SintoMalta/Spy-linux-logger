import { z } from "zod";
import { withMutation } from "@/server/http";
import { overrideGate } from "@/server/programme/gate-service";

const schema = z.object({ reason: z.string().min(3) });

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  return withMutation(request, async (user) => {
    const { id } = await ctx.params;
    const body = schema.parse(await request.json());
    return overrideGate(user, id, body.reason);
  });
}
