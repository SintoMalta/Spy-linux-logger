import { NextResponse } from "next/server";
import { z } from "zod";
import { AuthError, requireSession } from "@/server/auth/session";
import { DomainError } from "@/server/programme/task-service";
import { overrideGate } from "@/server/programme/gate-service";

const schema = z.object({ reason: z.string().min(3) });

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireSession();
    const { id } = await context.params;
    const body = schema.parse(await request.json());
    const override = await overrideGate(user, id, body.reason);
    return NextResponse.json({ ok: true, override });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json(
        { error: err.message },
        { status: err.code === "UNAUTHENTICATED" ? 401 : 403 },
      );
    }
    if (err instanceof DomainError || err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Invalid" },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
