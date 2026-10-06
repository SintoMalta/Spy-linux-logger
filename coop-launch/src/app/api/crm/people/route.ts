import { NextResponse } from "next/server";
import { z } from "zod";
import { AuthError, requireSession } from "@/server/auth/session";
import { DomainError } from "@/server/programme/task-service";
import { createPerson } from "@/server/crm/contacts";

const schema = z.object({
  name: z.string().min(1),
  organisationId: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  roleTitle: z.string().optional(),
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
    const person = await createPerson(user, {
      ...body,
      email: body.email || undefined,
      organisationId: body.organisationId || undefined,
    });
    return NextResponse.json({ ok: true, person });
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
