import { NextResponse } from "next/server";
import { AuthError, requireSession } from "@/server/auth/session";
import { DomainError } from "@/server/programme/task-service";
import { advanceStageIfGatePassed } from "@/server/programme/gate-service";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireSession();
    const { id } = await context.params;
    const result = await advanceStageIfGatePassed(user, id);
    return NextResponse.json({ ok: true, result });
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
