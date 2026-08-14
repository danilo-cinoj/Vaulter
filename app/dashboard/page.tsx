import { redirect } from "next/navigation";

export const metadata = { title: "Vaulter — creator vault" };

export default function DashboardPage() {
  redirect("/");
}
