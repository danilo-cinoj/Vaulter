import { NextRequest, NextResponse } from "next/server";
import { isRateLimited } from "@/lib/rate-limit";
import { getSupabase } from "@/lib/supabase-server";
import { normalizePhone, waitlistSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(`waitlist:${ip}`, 4)) {
    return NextResponse.json({ error: "Please wait a moment before trying again." }, { status: 429 });
  }

  const submitted = await request.json().catch(() => null);
  // Accept common visual formatting while validating/storing canonical E.164-like input.
  if (submitted?.phone) submitted.phone = normalizePhone(String(submitted.phone));
  const parsed = waitlistSchema.safeParse(submitted);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Please check your details." }, { status: 400 });
  if (parsed.data.website) return NextResponse.json({ ok: true });

  const email = parsed.data.email ? parsed.data.email.toLowerCase() : null;
  const phone = parsed.data.phone ? normalizePhone(parsed.data.phone) : null;
  try {
    const supabase = getSupabase();
    const duplicate = await supabase
      .from("waitlist_entries")
      .select("id")
      .or([email ? `email.eq.${email}` : "", phone ? `phone.eq.${phone}` : ""].filter(Boolean).join(","))
      .limit(1);
    if (duplicate.error) throw duplicate.error;
    if (duplicate.data.length) {
      return NextResponse.json({ error: "You’re already on the list — we’ll be in touch!", duplicate: true }, { status: 409 });
    }

    const { error } = await supabase.from("waitlist_entries").insert({
      first_name: parsed.data.firstName || null,
      email,
      phone,
      consent: true,
      source: "danilo-message-page",
    });
    if (error?.code === "23505") return NextResponse.json({ error: "You’re already on the list — we’ll be in touch!", duplicate: true }, { status: 409 });
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Waitlist submission failed", error);
    return NextResponse.json({ error: "We couldn’t add you just now. Please try again." }, { status: 503 });
  }
}
