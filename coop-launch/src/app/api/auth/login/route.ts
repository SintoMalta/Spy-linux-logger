import { NextResponse } from "next/server";
import { z } from "zod";
import {
  AuthError,
  SESSION_COOKIE,
  loginWithPassword,
} from "@/server/auth/session";
import { canManageProgramme } from "@/server/auth/rbac";
import { assertValidOrigin, clientIp, OriginError } from "@/server/security/origin";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    assertValidOrigin(request);
    const json = await request.json();
    const body = bodySchema.parse(json);
    const ip = clientIp(request);
    const userAgent = request.headers.get("user-agent") ?? undefined;
    const { token, user } = await loginWithPassword(body.email, body.password, {
      ip,
      userAgent,
    });

    const redirect = canManageProgramme(user) ? "/dashboard" : "/founder";
    const res = NextResponse.json({ ok: true, redirect, role: user.role });
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 14 * 24 * 60 * 60,
    });
    return res;
  } catch (err) {
    if (err instanceof OriginError) {
      return NextResponse.json({ error: err.message, code: "ORIGIN" }, { status: 403 });
    }
    if (err instanceof AuthError) {
      const status =
        err.code === "RATE_LIMITED"
          ? 429
          : err.code === "INVALID_CREDENTIALS"
            ? 401
            : 400;
      return NextResponse.json({ error: err.message, code: err.code }, { status });
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
