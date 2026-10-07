import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AuthError, requireSession, type SessionUser } from "@/server/auth/session";
import { DomainError } from "@/server/programme/task-service";
import { OriginError, assertValidOrigin } from "@/server/security/origin";

export async function withMutation<T>(
  request: Request,
  handler: (user: SessionUser) => Promise<T>,
): Promise<NextResponse> {
  try {
    assertValidOrigin(request);
    const user = await requireSession();
    const data = await handler(user);
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    return mapError(err);
  }
}

export async function withSessionJson<T>(
  handler: (user: SessionUser) => Promise<T>,
): Promise<NextResponse> {
  try {
    const user = await requireSession();
    const data = await handler(user);
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    return mapError(err);
  }
}

export function mapError(err: unknown): NextResponse {
  if (err instanceof OriginError) {
    return NextResponse.json({ error: err.message, code: "ORIGIN" }, { status: 403 });
  }
  if (err instanceof AuthError) {
    const status =
      err.code === "UNAUTHENTICATED"
        ? 401
        : err.code === "RATE_LIMITED"
          ? 429
          : 403;
    return NextResponse.json({ error: err.message, code: err.code }, { status });
  }
  if (err instanceof DomainError) {
    return NextResponse.json({ error: err.message, code: err.code }, { status: 400 });
  }
  if (err instanceof ZodError) {
    return NextResponse.json({ error: "Invalid input", details: err.flatten() }, { status: 400 });
  }
  if (err instanceof Error) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
  return NextResponse.json({ error: "Server error" }, { status: 500 });
}
