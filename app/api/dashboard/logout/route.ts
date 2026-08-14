import { NextResponse } from "next/server";
import { dashboardCookieName, dashboardCookieOptions } from "@/lib/dashboard-session";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(dashboardCookieName, "", { ...dashboardCookieOptions(), maxAge: 0 });
  return response;
}
