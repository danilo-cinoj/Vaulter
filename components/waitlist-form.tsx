"use client";

import { FormEvent, useState } from "react";

export function WaitlistForm() {
  const [status, setStatus] = useState<"idle" | "saving" | "success">("idle");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = {
      firstName: String(form.get("firstName") || ""),
      email: String(form.get("email") || ""),
      phone: String(form.get("phone") || ""),
      consent: form.get("consent") === "on",
      website: String(form.get("website") || ""),
    };
    setStatus("saving");
    setError("");
    try {
      const response = await fetch("/api/waitlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to join the waitlist.");
      setStatus("success");
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unable to join the waitlist.");
      setStatus("idle");
    }
  }

  if (status === "success") return <div className="waitlist-success" role="status" aria-live="polite"><span>✦</span><h2>You’re on the list ✨</h2><p>We’ll let you know when Vaulter is ready.</p></div>;

  return (
    <form className="waitlist-form" onSubmit={submit} noValidate>
      <div className="field"><label htmlFor="first-name">First name <span>optional</span></label><input id="first-name" name="firstName" autoComplete="given-name" /></div>
      <div className="field"><label htmlFor="email">Email address <span>optional</span></label><input id="email" name="email" type="email" inputMode="email" autoComplete="email" /></div>
      <div className="field"><label htmlFor="phone">Phone number <span>optional</span></label><input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="+1 415 555 2671" /><small>Include your country code.</small></div>
      <input className="honeypot" aria-hidden="true" tabIndex={-1} name="website" autoComplete="off" />
      <label className="checkbox"><input name="consent" type="checkbox" required /> <span>I agree to receive launch updates from Vaulter.</span></label>
      <button className="join-button" type="submit" disabled={status === "saving"}>{status === "saving" ? "Joining…" : "Join the waitlist"}</button>
      {error && <p className="form-error dark-error" role="alert">{error}</p>}
    </form>
  );
}
