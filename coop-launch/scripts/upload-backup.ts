import { readFileSync } from "fs";
import path from "path";
import { putObject } from "../src/server/storage/s3";

async function main() {
  const file = process.argv[2];
  const bucket = process.argv[3] ?? process.env.S3_BACKUP_BUCKET ?? "coop-launch-backups";
  const key = process.argv[4];
  if (!file || !key) {
    console.error("Usage: tsx scripts/upload-backup.ts <file> <bucket> <key>");
    process.exit(1);
  }
  const body = readFileSync(path.resolve(file));
  await putObject({
    bucket,
    key,
    body,
    contentType: "application/octet-stream",
  });
  console.log(`Uploaded ${body.length} bytes → ${bucket}/${key}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
