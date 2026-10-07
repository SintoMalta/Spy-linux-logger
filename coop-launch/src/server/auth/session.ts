import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";
import type { Role, User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getEnv } from "@/lib/env";
import { hashPassword, verifyPassword } from "./password";

export const SESSION_COOKIE = "coop_session";
const SESSION_DAYS = 14;

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function createSessionToken(): string {
  return randomBytes(32).toString("hex");
}

export type SessionUser = Pick<User, "id" | "email" | "name" | "role" | "active">;

export async function createSession(
  userId: string,
  meta?: { ip?: string; userAgent?: string },
): Promise<string> {
  const token = createSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await prisma.session.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      expiresAt,
      ip: meta?.ip,
      userAgent: meta?.userAgent,
    },
  });
  return token;
}

export async function revokeSession(token: string): Promise<void> {
  await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
}

export async function getSessionUser(
  token?: string | null,
): Promise<SessionUser | null> {
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: {
      user: {
        select: { id: true, email: true, name: true, role: true, active: true, deletedAt: true },
      },
    },
  });
  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await prisma.session.delete({ where: { id: session.id } }).catch(() => undefined);
    }
    return null;
  }
  if (!session.user.active || session.user.deletedAt) return null;
  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role,
    active: session.user.active,
  };
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  return getSessionUser(jar.get(SESSION_COOKIE)?.value);
}

export async function requireSession(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthError("UNAUTHENTICATED", "Authentication required");
  }
  return user;
}

export class AuthError extends Error {
  constructor(
    public code: "UNAUTHENTICATED" | "FORBIDDEN" | "RATE_LIMITED" | "INVALID_CREDENTIALS",
    message: string,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export async function isRateLimited(email: string, ip: string): Promise<boolean> {
  const env = getEnv();
  const since = new Date(Date.now() - env.LOGIN_WINDOW_MINUTES * 60 * 1000);
  const failures = await prisma.loginAttempt.count({
    where: { email: email.toLowerCase(), ip, success: false, createdAt: { gte: since } },
  });
  return failures >= env.LOGIN_MAX_ATTEMPTS;
}

export async function recordLoginAttempt(
  email: string,
  ip: string,
  success: boolean,
): Promise<void> {
  await prisma.loginAttempt.create({
    data: { email: email.toLowerCase(), ip, success },
  });
}

export async function loginWithPassword(
  email: string,
  password: string,
  meta: { ip: string; userAgent?: string },
): Promise<{ token: string; user: SessionUser }> {
  const normalized = email.trim().toLowerCase();
  if (await isRateLimited(normalized, meta.ip)) {
    throw new AuthError("RATE_LIMITED", "Too many login attempts. Try again later.");
  }

  const user = await prisma.user.findFirst({
    where: { email: normalized, deletedAt: null },
  });

  const ok = user && user.active ? await verifyPassword(user.passwordHash, password) : false;
  await recordLoginAttempt(normalized, meta.ip, Boolean(ok));

  if (!user || !ok) {
    throw new AuthError("INVALID_CREDENTIALS", "Invalid email or password");
  }

  const token = await createSession(user.id, meta);
  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      active: user.active,
    },
  };
}

export { hashPassword, verifyPassword };
export type { Role };
