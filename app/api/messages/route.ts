import { NextRequest, NextResponse } from "next/server";
import { isRateLimited } from "@/lib/rate-limit";
import { getSupabase } from "@/lib/supabase-server";
import { messageSchema } from "@/lib/validation";
import { normalizeHandle } from "@/lib/validation";

export const runtime = "nodejs";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

function identifyImage(bytes: Uint8Array) {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return { extension: "jpg", contentType: "image/jpeg" };
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a) return { extension: "png", contentType: "image/png" };
  if (bytes.length >= 12 && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return { extension: "webp", contentType: "image/webp" };
  return null;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(`message:${ip}`)) {
    return NextResponse.json({ error: "Please wait a moment before sending another message." }, { status: 429 });
  }

  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Invalid message." }, { status: 400 });

  const rawImage = form.get("image");
  const image = rawImage instanceof File && rawImage.size > 0 ? rawImage : null;
  const recipientHandle = typeof form.get("recipientHandle") === "string" ? normalizeHandle(String(form.get("recipientHandle"))) : "";
  const parsed = messageSchema.safeParse({
    body: typeof form.get("body") === "string" ? form.get("body") : "",
    hasImage: Boolean(image),
    website: typeof form.get("website") === "string" ? form.get("website") : "",
  });
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid message." }, { status: 400 });
  if (parsed.data.website) return NextResponse.json({ ok: true });
  if (!recipientHandle) return NextResponse.json({ error: "This message link is unavailable." }, { status: 404 });

  let imageBytes: Uint8Array | null = null;
  let imageInfo: { extension: string; contentType: string } | null = null;
  if (image) {
    if (image.size > MAX_IMAGE_BYTES) return NextResponse.json({ error: "Choose an image smaller than 8 MB." }, { status: 400 });
    imageBytes = new Uint8Array(await image.arrayBuffer());
    imageInfo = identifyImage(imageBytes);
    if (!imageInfo) return NextResponse.json({ error: "Use a JPG, PNG, or WebP image." }, { status: 400 });
  }

  try {
    const supabase = getSupabase();
    const { data: creator, error: creatorError } = await supabase.from("creators").select("id").eq("handle", recipientHandle).maybeSingle();
    if (creatorError) throw creatorError;
    if (!creator) return NextResponse.json({ error: "This message link is unavailable." }, { status: 404 });
    let imagePath: string | null = null;
    if (imageBytes && imageInfo) {
      imagePath = `${recipientHandle}/${Date.now()}-${crypto.randomUUID()}.${imageInfo.extension}`;
      const { error: uploadError } = await supabase.storage.from("message-images").upload(imagePath, imageBytes, {
        contentType: imageInfo.contentType,
        cacheControl: "31536000",
        upsert: false,
      });
      if (uploadError) throw uploadError;
    }

    const { error } = await supabase.from("messages").insert({
      body: parsed.data.body,
      recipient_handle: recipientHandle,
      image_path: imagePath,
      image_content_type: imageInfo?.contentType ?? null,
    });
    if (error) {
      if (imagePath) await supabase.storage.from("message-images").remove([imagePath]);
      throw error;
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Message submission failed", error);
    return NextResponse.json({ error: "We couldn’t send that just now. Please try again." }, { status: 503 });
  }
}
