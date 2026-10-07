import { withMutation } from "@/server/http";
import { autoEvaluateGate } from "@/server/programme/gate-service";
import { canManageProgramme } from "@/server/auth/rbac";
import { AuthError } from "@/server/auth/session";

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  return withMutation(request, async (user) => {
    if (!canManageProgramme(user)) throw new AuthError("FORBIDDEN", "Insufficient permissions");
    const { id } = await ctx.params;
    return autoEvaluateGate(id);
  });
}
