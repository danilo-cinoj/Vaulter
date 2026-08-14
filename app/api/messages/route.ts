import { NextRequest, NextResponse } from "next/server";
import { isRateLimited } from "@/lib/rate-limit";
import { getSupabase } from "@/lib/supabase-server";
import { messageSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(`message:${ip}`)) {
    return NextResponse.json({ error: "Please wait a moment before sending another message." }, { status: 429 });
  }

  const parsed = messageSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid message." }, { status: 400 });
  if (parsed.data.website) return NextResponse.json({ ok: true });

  try {
    const { error } = await getSupabase().from("messages").insert({
      body: parsed.data.body,
      recipient_handle: "danilocinoj",
    });
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Message submission failed", error);
    return NextResponse.json({ error: "We couldn’t send that just now. Please try again." }, { status: 503 });
  }
}
