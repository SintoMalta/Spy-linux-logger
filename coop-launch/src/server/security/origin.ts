import { getEnv } from "@/lib/env";

/**
 * CSRF / Origin checks for cookie-authenticated mutations.
 * Behind Caddy, trust only the first X-Forwarded-For hop when TRUST_PROXY=true.
 */
export function getAllowedOrigins(): string[] {
  const env = getEnv();
  const extras = (process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const base = Array.from(new Set([env.APP_URL, ...extras]));
  // Local dual-stack convenience: treat localhost ↔ 127.0.0.1 as equivalent
  const expanded = [...base];
  for (const o of base) {
    if (o.includes("localhost")) {
      expanded.push(o.replace("localhost", "127.0.0.1"));
    }
    if (o.includes("127.0.0.1")) {
      expanded.push(o.replace("127.0.0.1", "localhost"));
    }
  }
  return Array.from(new Set(expanded));
}

export function assertValidOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  // Same-origin navigations (e.g. form GET) may omit Origin; require Origin or Referer for mutations
  const referer = request.headers.get("referer");
  const allowed = getAllowedOrigins();
  const candidate = origin ?? (referer ? new URL(referer).origin : null);
  if (!candidate) {
    throw new OriginError("Missing Origin/Referer on mutating request");
  }
  if (!allowed.some((a) => candidate === a || candidate.startsWith(a))) {
    throw new OriginError(`Origin not allowed: ${candidate}`);
  }
}

export class OriginError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OriginError";
  }
}

/**
 * Client IP for rate limiting. When TRUST_PROXY=true (prod behind Caddy),
 * use the left-most X-Forwarded-For hop only; otherwise ignore spoofable headers.
 */
export function clientIp(request: Request): string {
  const trust = process.env.TRUST_PROXY === "true";
  if (trust) {
    const xff = request.headers.get("x-forwarded-for");
    if (xff) {
      return xff.split(",")[0]?.trim() || "0.0.0.0";
    }
  }
  return "127.0.0.1";
}
