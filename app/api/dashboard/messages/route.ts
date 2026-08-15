import { NextResponse } from "next/server";
import { getDashboardSession } from "@/lib/dashboard-session";
import { getSupabase } from "@/lib/supabase-server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = getDashboardSession();
  const requestedHandle = new URL(request.url).searchParams.get("handle");
  if (!session || requestedHandle !== session.handle) return NextResponse.json({ error: "Creator sign-in required." }, { status: 401 });

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("messages")
      .select("id, body, created_at, image_path, image_content_type")
      .eq("recipient_handle", session.handle)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;

    const messages = await Promise.all((data ?? []).map(async (message) => {
      let imageUrl: string | null = null;
      if (message.image_path) {
        const { data: signed, error: signedError } = await supabase.storage
          .from("message-images")
          .createSignedUrl(message.image_path, 60 * 30);
        if (signedError) throw signedError;
        imageUrl = signed.signedUrl;
      }
      return { ...message, imageUrl };
    }));
    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Dashboard messages failed", error);
    return NextResponse.json({ error: "We couldn’t load the vault right now." }, { status: 503 });
  }
}
