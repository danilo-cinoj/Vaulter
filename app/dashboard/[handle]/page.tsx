import { DashboardApp } from "@/components/dashboard-app";
import { normalizeHandle } from "@/lib/validation";
import { notFound } from "next/navigation";

export const metadata = { title: "Vaulter — creator vault" };

export default function CreatorDashboardPage({ params }: { params: { handle: string } }) {
  const handle = normalizeHandle(params.handle);
  if (!/^[a-z0-9_]{3,30}$/.test(handle)) notFound();
  return <DashboardApp handle={handle} />;
}
