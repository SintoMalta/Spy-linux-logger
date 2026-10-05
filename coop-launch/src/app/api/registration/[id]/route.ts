import { z } from "zod";
import { withMutation } from "@/server/http";
import { updateRegistrationRequirement } from "@/server/registration/readiness";

const schema = z.object({
  completed: z.boolean().optional(),
  notes: z.string().optional(),
  evidenceDocumentId: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
});

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  return withMutation(request, async (user) => {
    const { id } = await ctx.params;
    const body = schema.parse(await request.json());
    return updateRegistrationRequirement(user, id, body);
  });
}
