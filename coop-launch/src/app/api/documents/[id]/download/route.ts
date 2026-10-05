import { prisma } from "@/lib/prisma";
import { requireSession } from "@/server/auth/session";
import { assertDocumentVisibility } from "@/server/auth/rbac";
import { getDownloadUrl, getObject } from "@/server/storage/s3";
import { mapError } from "@/server/http";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireSession();
    const { id } = await ctx.params;
    const doc = await prisma.document.findFirst({ where: { id, deletedAt: null } });
    if (!doc) return Response.json({ error: "Not found" }, { status: 404 });
    assertDocumentVisibility(user, doc.visibility);
    const signed = await getDownloadUrl({ key: doc.key });
    if (signed) {
      return Response.redirect(signed, 302);
    }
    const body = await getObject({ key: doc.key });
    return new Response(new Uint8Array(body), {
      headers: {
        "Content-Type": doc.mimeType,
        "Content-Disposition": `attachment; filename="${doc.filename}"`,
        "X-Content-SHA256": doc.sha256,
      },
    });
  } catch (err) {
    return mapError(err);
  }
}
