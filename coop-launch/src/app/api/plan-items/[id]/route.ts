import { NextResponse } from "next/server";
import { z } from "zod";
import { AuthError, requireSession } from "@/server/auth/session";
import { prisma } from "@/lib/prisma";
import { DomainError } from "@/server/programme/task-service";

const schema = z.object({ done: z.boolean() });

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireSession();
    const { id } = await context.params;
    const body = schema.parse(await request.json());
    const item = await prisma.dailyPlanItem.findUnique({
      where: { id },
      include: { plan: true },
    });
    if (!item) throw new DomainError("NOT_FOUND", "Plan item not found");
    if (item.plan.userId !== user.id) {
      throw new AuthError("FORBIDDEN", "Not your plan item");
    }
    const updated = await prisma.dailyPlanItem.update({
      where: { id },
      data: { done: body.done },
    });
    return NextResponse.json({ ok: true, item: updated });
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
