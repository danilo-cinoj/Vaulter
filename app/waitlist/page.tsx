import Link from "next/link";
import { WaitlistForm } from "@/components/waitlist-form";

export default function WaitlistPage() {
  return (
    <main className="gradient-page waitlist-page">
      <section className="waitlist-panel" aria-labelledby="waitlist-heading">
        <img className="panel-logo" src="/vaulter-orange-black.svg" alt="Vaulter" />
        <h1 id="waitlist-heading">Get your own anonymous message link</h1>
        <p className="lead">Vaulter is still in development. Join the waitlist and we’ll let you know when personal links are ready.</p>
        <WaitlistForm />
        <Link className="back-link" href="/">← Back to Danilo’s page</Link>
      </section>
    </main>
  );
}
