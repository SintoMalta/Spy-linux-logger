import { z } from "zod";
import { withMutation } from "@/server/http";
import { softDeleteNote, updateNote } from "@/server/coordinator/notes";

const schema = z.object({
  title: z.string().optional(),
  body: z.string().optional(),
  softDelete: z.boolean().optional(),
});

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  return withMutation(request, async (user) => {
    const { id } = await ctx.params;
    const body = schema.parse(await request.json());
    if (body.softDelete) return softDeleteNote(user, id);
    return updateNote(user, id, { title: body.title, body: body.body });
  });
}
