import { NextResponse } from "next/server";
import { z } from "zod";
import { AuthError, requireSession } from "@/server/auth/session";
import { respondToFounderAction } from "@/server/programme/founder-actions";
import { DomainError } from "@/server/programme/task-service";

const schema = z.object({
  action: z.enum(["DONE", "COMMENT", "CALL_NESLI", "DEFER"]),
  comment: z.string().optional(),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireSession();
    const { id } = await context.params;
    const body = schema.parse(await request.json());
    const updated = await respondToFounderAction(user, id, body);
    return NextResponse.json({ ok: true, item: updated });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json(
        { error: err.message },
        { status: err.code === "UNAUTHENTICATED" ? 401 : 403 },
      );
    }
    if (err instanceof DomainError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: 400 });
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
