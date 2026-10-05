import { z } from "zod";
import { withMutation } from "@/server/http";
import { setWeek9Decision } from "@/server/programme/gate-service";

const schema = z.object({ decision: z.enum(["GO", "CONDITIONAL_GO", "NO_GO"]) });

export async function POST(request: Request) {
  return withMutation(request, async (user) => {
    const body = schema.parse(await request.json());
    return setWeek9Decision(user, body.decision);
  });
}
