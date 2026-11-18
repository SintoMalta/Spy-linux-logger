import { describe, expect, it } from "vitest";
import {
  assertValidOrigin,
  getAllowedOrigins,
  OriginError,
} from "@/server/security/origin";

describe("mutation origin check", () => {
  it("rejects an origin that only prefixes an allowed origin", () => {
    const allowed = [
      ...new Set(getAllowedOrigins().map((entry) => new URL(entry).origin)),
    ];
    const base = allowed[0];
    const lookalike = `${base}9`;

    expect(lookalike.startsWith(base)).toBe(true);
    expect(allowed).not.toContain(lookalike);

    const rejected = new Request("http://localhost/api/tasks/example/result", {
      method: "POST",
      headers: { origin: lookalike },
    });
    expect(() => assertValidOrigin(rejected)).toThrow(OriginError);

    const accepted = new Request("http://localhost/api/tasks/example/result", {
      method: "POST",
      headers: { origin: base },
    });
    expect(() => assertValidOrigin(accepted)).not.toThrow();
  });
});
