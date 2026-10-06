import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { AuthError, requireSession } from "@/server/auth/session";
import { canManageProgramme } from "@/server/auth/rbac";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/server/audit";
import { uploadObject } from "@/lib/s3";
import { DomainError } from "@/server/programme/task-service";

export async function POST(request: Request) {
  try {
    const user = await requireSession();
    if (!canManageProgramme(user)) {
      throw new AuthError("FORBIDDEN", "Only coordinators can upload documents");
    }
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      throw new DomainError("VALIDATION", "file is required");
    }
    if (file.size <= 0) throw new DomainError("VALIDATION", "Empty file");
    if (file.size > 20 * 1024 * 1024) {
      throw new DomainError("VALIDATION", "File must be under 20MB");
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const key = `uploads/${user.id}/${Date.now()}-${safeName}`;

    await uploadObject({
      key,
      body: bytes,
      contentType: file.type || "application/octet-stream",
    });

    const doc = await prisma.document.create({
      data: {
        key,
        filename: file.name,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
        sha256,
        visibility: "COORDINATOR",
        uploadedById: user.id,
      },
    });

    await writeAudit({
      actorId: user.id,
      action: "DOCUMENT_UPLOADED",
      entityType: "Document",
      entityId: doc.id,
      after: { filename: doc.filename, size: doc.size },
    });

    return NextResponse.json({ ok: true, document: doc });
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
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 },
    );
  }
}
