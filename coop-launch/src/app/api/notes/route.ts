import { z } from "zod";
import { withMutation, withSessionJson } from "@/server/http";
import { createNote, listNotes } from "@/server/coordinator/notes";

const schema = z.object({
  title: z.string().optional(),
  body: z.string().min(1),
});

export async function GET() {
  return withSessionJson(async (user) => listNotes(user));
}

export async function POST(request: Request) {
  return withMutation(request, async (user) => {
    const body = schema.parse(await request.json());
    return createNote(user, body);
  });
}
