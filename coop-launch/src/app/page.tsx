import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { canManageProgramme, canAccessFounderDashboard } from "@/server/auth/rbac";
import { LoginForm } from "@/components/login-form";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user) {
    if (canManageProgramme(user)) redirect("/dashboard");
    if (canAccessFounderDashboard(user)) redirect("/founder");
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-lg flex-col justify-center px-4 py-10">
      <div className="mb-8">
        <p className="font-[family-name:var(--font-display)] text-4xl tracking-tight text-[var(--brand-dark)] sm:text-5xl">
          CoopLaunch Malta
        </p>
        <p className="mt-3 text-[var(--muted)]">
          Evidence → Decision → Gate for the 12-week cooperative founding programme.
        </p>
      </div>
      <LoginForm />
    </main>
  );
}
