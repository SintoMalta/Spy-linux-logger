import { prisma } from "@/lib/prisma";
import { withSessionJson, mapError } from "@/server/http";
import { canManageProgramme, assertDocumentVisibility } from "@/server/auth/rbac";
import { AuthError, requireSession } from "@/server/auth/session";
import { assertValidOrigin } from "@/server/security/origin";
import { assertAllowedUpload, putObject, sha256Buffer } from "@/server/storage/s3";
import { writeAudit } from "@/server/audit";
import { randomUUID } from "crypto";

export async function GET() {
  return withSessionJson(async (user) => {
    const docs = await prisma.document.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return docs.filter((d) => {
      try {
        assertDocumentVisibility(user, d.visibility);
        return true;
      } catch {
        return false;
      }
    });
  });
}

export async function POST(request: Request) {
  try {
    assertValidOrigin(request);
    const user = await requireSession();
    if (!canManageProgramme(user)) throw new AuthError("FORBIDDEN", "Insufficient permissions");

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new Error("file required");
    const linkedType = String(form.get("linkedType") ?? "") || null;
    const linkedId = String(form.get("linkedId") ?? "") || null;
    const visibility = String(form.get("visibility") ?? "COORDINATOR");
    const buf = Buffer.from(await file.arrayBuffer());
    assertAllowedUpload(file.type || "application/octet-stream", buf.length);
    const sha = sha256Buffer(buf);
    const key = `uploads/${new Date().toISOString().slice(0, 10)}/${randomUUID()}-${file.name}`;
    await putObject({ key, body: buf, contentType: file.type || "application/octet-stream" });
    const doc = await prisma.document.create({
      data: {
        key,
        filename: file.name,
        mimeType: file.type || "application/octet-stream",
        size: buf.length,
        sha256: sha,
        visibility,
        linkedType,
        linkedId,
        uploadedById: user.id,
      },
    });
    if (linkedType === "RegistrationRequirement" && linkedId) {
      await prisma.registrationRequirement.update({
        where: { id: linkedId },
        data: { evidenceDocumentId: doc.id },
      });
    }
    await writeAudit({
      actorId: user.id,
      action: "DOCUMENT_UPLOAD",
      entityType: "Document",
      entityId: doc.id,
      after: { filename: doc.filename, sha256: sha, linkedType, linkedId },
    });
    return Response.json({ ok: true, data: doc });
  } catch (err) {
    return mapError(err);
  }
}
