import { NextRequest, NextResponse } from "next/server";
import { createDashboardSession, creatorKeyIsValid, dashboardCookieName, dashboardCookieOptions } from "@/lib/dashboard-session";
import { isRateLimited } from "@/lib/rate-limit";
import { getSupabase } from "@/lib/supabase-server";
import { normalizeHandle } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(`dashboard-login:${ip}`, 5, 15 * 60_000)) {
    return NextResponse.json({ error: "Too many attempts. Please try again in a few minutes." }, { status: 429 });
  }

  const { key, handle: rawHandle } = await request.json().catch(() => ({}));
  const handle = typeof rawHandle === "string" ? normalizeHandle(rawHandle) : "";
  if (typeof key !== "string" || !handle) return NextResponse.json({ error: "That creator key isn’t right." }, { status: 401 });
  try {
    const { data, error } = await getSupabase().from("creators").select("dashboard_key_hash").eq("handle", handle).maybeSingle();
    if (error) throw error;
    if (!data || !creatorKeyIsValid(key, handle, data.dashboard_key_hash)) return NextResponse.json({ error: "That creator key isn’t right." }, { status: 401 });

    const response = NextResponse.json({ ok: true });
    response.cookies.set(dashboardCookieName, createDashboardSession(handle), dashboardCookieOptions());
    return response;
  } catch (error) {
    console.error("Creator sign-in failed", error);
    return NextResponse.json({ error: "We couldn’t unlock the vault right now." }, { status: 503 });
  }
}
