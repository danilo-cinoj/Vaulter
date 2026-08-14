import { NextRequest, NextResponse } from "next/server";
import { accessKeyIsValid, createDashboardSession, dashboardCookieName, dashboardCookieOptions } from "@/lib/dashboard-session";
import { isRateLimited } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(`dashboard-login:${ip}`, 5, 15 * 60_000)) {
    return NextResponse.json({ error: "Too many attempts. Please try again in a few minutes." }, { status: 429 });
  }

  const { key } = await request.json().catch(() => ({}));
  if (!accessKeyIsValid(key)) return NextResponse.json({ error: "That creator key isn’t right." }, { status: 401 });

  const response = NextResponse.json({ ok: true });
  response.cookies.set(dashboardCookieName, createDashboardSession(), dashboardCookieOptions());
  return response;
}
