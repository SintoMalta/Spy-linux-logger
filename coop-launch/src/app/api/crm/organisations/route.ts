import { NextResponse } from "next/server";
import { z } from "zod";
import { AuthError, requireSession } from "@/server/auth/session";
import { DomainError } from "@/server/programme/task-service";
import { createOrganisation } from "@/server/crm/contacts";

const schema = z.object({
  name: z.string().min(1),
  sector: z.string().optional(),
  notes: z.string().optional(),
  status: z
    .enum([
      "ACTIVE",
      "CONTACTED",
      "QUALIFIED",
      "NURTURE",
      "DO_NOT_PURSUE",
      "ARCHIVED",
    ])
    .optional(),
});

export async function POST(request: Request) {
  try {
    const user = await requireSession();
    const body = schema.parse(await request.json());
    const org = await createOrganisation(user, body);
    return NextResponse.json({ ok: true, organisation: org });
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
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
