/**
 * One-time interactive bootstrap for first ADMIN/COORDINATOR in production.
 * Never commits passwords. Refuses if ALLOW_BOOTSTRAP is not true.
 *
 * Usage:
 *   ALLOW_BOOTSTRAP=true pnpm exec tsx scripts/bootstrap-admin.ts
 */
import { createInterface } from "readline/promises";
import { stdin as input, stdout as output } from "process";
import { PrismaClient } from "@prisma/client";
import * as argon2 from "argon2";

const prisma = new PrismaClient();

async function ask(rl: ReturnType<typeof createInterface>, q: string) {
  return rl.question(q);
}

async function main() {
  if (process.env.ALLOW_BOOTSTRAP !== "true") {
    console.error("Set ALLOW_BOOTSTRAP=true to run this script.");
    process.exit(1);
  }

  const rl = createInterface({ input, output });
  try {
    const email = (await ask(rl, "Admin email: ")).trim().toLowerCase();
    const name = (await ask(rl, "Display name: ")).trim() || "Admin";
    const roleRaw = (await ask(rl, "Role [ADMIN|COORDINATOR] (default ADMIN): ")).trim() || "ADMIN";
    const password = await ask(rl, "Password (will not be echoed in logs): ");
    if (!email || password.length < 12) {
      throw new Error("Email required; password must be ≥12 characters");
    }
    const role = roleRaw === "COORDINATOR" ? "COORDINATOR" : "ADMIN";
    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
    });
    const user = await prisma.user.upsert({
      where: { email },
      update: { name, role, passwordHash, mustChangePassword: true, active: true },
      create: { email, name, role, passwordHash, mustChangePassword: true },
    });
    console.log(`Bootstrap OK: ${user.email} (${user.role}) mustChangePassword=true`);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
