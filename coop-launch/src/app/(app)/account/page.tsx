import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { landingPath } from "@/server/auth/rbac";

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  const next = landingPath(user);
  if (next !== "/account") redirect(next);

  return (
    <div className="space-y-4">
      <header>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--brand-dark)]">
          Your account
        </h1>
        <p className="mt-2 max-w-xl text-[var(--muted)]">
          You are signed in as {user.name}. This login does not open the coordinator
          workspace or the founder asks page.
        </p>
      </header>
      <p className="text-sm text-[var(--muted)]">Use Log out in the top bar when you are finished.</p>
    </div>
  );
}
