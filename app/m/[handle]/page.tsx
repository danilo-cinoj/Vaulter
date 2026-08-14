import { notFound } from "next/navigation";
import { MessageCard } from "@/components/message-card";
import { FooterLinks } from "@/components/footer-links";
import { getSupabase } from "@/lib/supabase-server";
import { normalizeHandle } from "@/lib/validation";

export const dynamic = "force-dynamic";

export default async function CreatorMessagePage({ params }: { params: { handle: string } }) {
  const handle = normalizeHandle(params.handle);
  if (!/^[a-z0-9_]{3,30}$/.test(handle)) notFound();
  const { data } = await getSupabase().from("creators").select("handle").eq("handle", handle).maybeSingle();
  if (!data) notFound();

  return <main className="gradient-page message-page"><section className="message-shell" aria-label={`Send ${handle} an anonymous message`}><MessageCard handle={handle} /><p className="privacy-note">Your name isn’t shown to @{handle}. Please keep it kind.</p></section><section className="conversion" aria-label="Try Vaulter"><p className="conversion-kicker">Anonymous text or a photo — your call.</p><a className="cta-button" href="/">Create your own Vaulter link</a></section><footer className="site-footer"><img className="footer-logo" src="/vaulter-orange-white.svg" alt="Vaulter" /><FooterLinks /></footer></main>;
}
