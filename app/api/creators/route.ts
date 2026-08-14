import { NextRequest, NextResponse } from "next/server";
import { createDashboardSession, dashboardCookieName, dashboardCookieOptions, hashCreatorKey } from "@/lib/dashboard-session";
import { isRateLimited } from "@/lib/rate-limit";
import { getSupabase } from "@/lib/supabase-server";
import { creatorSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(`creator-create:${ip}`, 4, 15 * 60_000)) {
    return NextResponse.json({ error: "Please wait a few minutes before creating another link." }, { status: 429 });
  }
  const parsed = creatorSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Please check your details." }, { status: 400 });

  try {
    const { handle, key } = parsed.data;
    const { error } = await getSupabase().from("creators").insert({
      handle,
      dashboard_key_hash: hashCreatorKey(key, handle),
    });
    if (error?.code === "23505") return NextResponse.json({ error: "That custom link is already taken." }, { status: 409 });
    if (error) throw error;

    const response = NextResponse.json({ ok: true, handle, publicPath: `/m/${handle}`, dashboardPath: `/dashboard/${handle}` });
    response.cookies.set(dashboardCookieName, createDashboardSession(handle), dashboardCookieOptions());
    return response;
  } catch (error) {
    console.error("Creator creation failed", error);
    return NextResponse.json({ error: "We couldn’t create your link right now. Please try again." }, { status: 503 });
  }
}
