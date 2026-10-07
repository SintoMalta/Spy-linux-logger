import { z } from "zod";
import { withMutation, withSessionJson } from "@/server/http";
import { createAppIssue, listAppIssues } from "@/server/coordinator/app-issues";

const schema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  pageOrTab: z.string().optional(),
});

export async function GET() {
  return withSessionJson(async (user) => listAppIssues(user));
}

export async function POST(request: Request) {
  return withMutation(request, async (user) => {
    const body = schema.parse(await request.json());
    return createAppIssue(user, body);
  });
}
