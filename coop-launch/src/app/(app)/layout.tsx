import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { AppNav } from "@/components/app-nav";

export default async function AppSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  return (
    <div className="min-h-[100dvh]">
      <AppNav user={user} />
      <div className="mx-auto max-w-6xl px-4 py-6">{children}</div>
    </div>
  );
}
