import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/ui/sidebar";
import { getNotificationCounts } from "@/lib/notifications";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const notifications = await getNotificationCounts(
    session.user.id,
    session.user.role
  );

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={session.user} notifications={notifications} />
      <main className="flex-1 overflow-y-auto bg-surface p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
