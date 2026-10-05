import { createHash } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/plain",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export function assertAllowedUpload(mimeType: string, size: number) {
  if (!ALLOWED_MIME.has(mimeType)) {
    throw new Error(`MIME type not allowed: ${mimeType}`);
  }
  if (size > MAX_UPLOAD_BYTES) {
    throw new Error(`File too large (max ${MAX_UPLOAD_BYTES} bytes)`);
  }
}

export function sha256Buffer(buf: Buffer): string {
  return createHash("sha256").update(buf).digest("hex");
}

function isLocalFsDriver(): boolean {
  if (process.env.S3_DRIVER === "s3") return false;
  if (process.env.S3_DRIVER === "fs") return true;
  // Default to local filesystem when MinIO/S3 is unavailable in this environment
  return true;
}

function localRoot(): string {
  return process.env.LOCAL_S3_ROOT ?? path.join(process.cwd(), ".data", "s3");
}

async function ensureLocalBucket(bucket: string) {
  await fs.mkdir(path.join(localRoot(), bucket), { recursive: true });
}

function s3Client() {
  const endpoint = process.env.S3_ENDPOINT;
  return new S3Client({
    region: process.env.S3_REGION ?? "us-east-1",
    endpoint: endpoint || undefined,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY ?? "minioadmin",
      secretAccessKey: process.env.S3_SECRET_KEY ?? "minioadmin",
    },
  });
}

export async function putObject(params: {
  bucket?: string;
  key: string;
  body: Buffer;
  contentType: string;
}) {
  const bucket = params.bucket ?? process.env.S3_BUCKET ?? "coop-launch";
  if (isLocalFsDriver() || process.env.S3_DRIVER === "fs") {
    await ensureLocalBucket(bucket);
    const filePath = path.join(localRoot(), bucket, params.key);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, params.body);
    return { bucket, key: params.key, driver: "fs" as const };
  }

  const client = s3Client();
  try {
    await client.send(new HeadBucketCommand({ Bucket: bucket }));
  } catch {
    try {
      await client.send(new CreateBucketCommand({ Bucket: bucket }));
    } catch {
      // bucket may already exist or creation may be restricted
    }
  }
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: params.key,
      Body: params.body,
      ContentType: params.contentType,
    }),
  );
  return { bucket, key: params.key, driver: "s3" as const };
}

export async function getObject(params: { bucket?: string; key: string }) {
  const bucket = params.bucket ?? process.env.S3_BUCKET ?? "coop-launch";
  if (isLocalFsDriver() || process.env.S3_DRIVER === "fs") {
    const filePath = path.join(localRoot(), bucket, params.key);
    const body = await fs.readFile(filePath);
    return body;
  }
  const client = s3Client();
  const res = await client.send(
    new GetObjectCommand({ Bucket: bucket, Key: params.key }),
  );
  const bytes = await res.Body?.transformToByteArray();
  return Buffer.from(bytes ?? []);
}

export async function getDownloadUrl(params: {
  bucket?: string;
  key: string;
  expiresIn?: number;
}) {
  const bucket = params.bucket ?? process.env.S3_BUCKET ?? "coop-launch";
  if (isLocalFsDriver() || process.env.S3_DRIVER === "fs") {
    // App-mediated download; caller should use /api/documents/[id]/download
    return null;
  }
  const client = s3Client();
  return getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: bucket, Key: params.key }),
    { expiresIn: params.expiresIn ?? 300 },
  );
}
