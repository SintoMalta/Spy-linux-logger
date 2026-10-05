import { NextResponse } from "next/server";
import { z } from "zod";
import { AuthError, requireSession } from "@/server/auth/session";
import {
  DomainError,
  markTaskAchieved,
} from "@/server/programme/task-service";

const schema = z.object({
  overrideReason: z.string().optional(),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireSession();
    const { id } = await context.params;
    const body = schema.parse(await request.json().catch(() => ({})));
    const task = await markTaskAchieved(user, id, {
      overrideReason: body.overrideReason,
    });
    return NextResponse.json({ ok: true, task });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json(
        { error: err.message },
        { status: err.code === "UNAUTHENTICATED" ? 401 : 403 },
      );
    }
    if (err instanceof DomainError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
