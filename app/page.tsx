import { MessageCard } from "@/components/message-card";
import { FooterLinks } from "@/components/footer-links";

export default function HomePage() {
  return (
    <main className="gradient-page message-page">
      <section className="message-shell" aria-label="Send Danilo an anonymous message">
        <MessageCard />
        <p className="privacy-note">Your name isn’t shown to Danilo. Please keep it kind.</p>
      </section>

      <section className="conversion" aria-label="Try Vaulter">
        <p className="conversion-kicker">👇 Be among the first to try Vaulter 👇</p>
        <a className="cta-button" href="/waitlist">Get your own messages!</a>
      </section>

      <footer className="site-footer">
        <img className="footer-logo" src="/vaulter-orange-white.svg" alt="Vaulter" />
        <FooterLinks />
      </footer>
    </main>
  );
}
