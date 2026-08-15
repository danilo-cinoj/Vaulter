import { redirect } from "next/navigation";
import { DashboardAccess } from "@/components/dashboard-access";
import { getDashboardSession } from "@/lib/dashboard-session";

export const metadata = { title: "Vaulter — creator vault" };

export default function DashboardPage() {
  const session = getDashboardSession();
  if (session) redirect(`/dashboard/${session.handle}`);
  return <DashboardAccess />;
}
