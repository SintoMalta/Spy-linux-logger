import { z } from "zod";
import { withMutation } from "@/server/http";
import { markRegistrationSubmitted } from "@/server/programme/gate-service";

const schema = z.object({ verified: z.literal(true) });

export async function POST(request: Request) {
  return withMutation(request, async (user) => {
    const body = schema.parse(await request.json());
    return markRegistrationSubmitted(user, body.verified);
  });
}
