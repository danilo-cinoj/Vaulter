"use client";

import { FormEvent, useState } from "react";

export function CreatorSetup() {
  const [handle, setHandle] = useState("");
  const [key, setKey] = useState("");
  const [created, setCreated] = useState<{ handle: string; publicPath: string; dashboardPath: string } | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true); setError("");
    try {
      const response = await fetch("/api/creators", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ handle, key }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Couldn’t create your link.");
      setCreated(result);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Couldn’t create your link.");
    } finally { setSaving(false); }
  }

  if (created) return <section className="creator-ready" aria-live="polite"><span>✦</span><p className="eyebrow">YOUR LINK IS READY</p><h1>Meet your vault.</h1><code>{typeof window === "undefined" ? created.publicPath : `${window.location.origin}${created.publicPath}`}</code><a className="creator-primary" href={created.dashboardPath}>Open @{created.handle}’s dashboard</a><button onClick={() => void navigator.clipboard.writeText(`${window.location.origin}${created.publicPath}`)}>Copy my message link</button></section>;

  return <section className="creator-setup"><a className="creator-access" href="/dashboard">Access your messages →</a><img src="/vaulter-orange-black.svg" alt="Vaulter" /><p className="eyebrow">CREATE YOUR PERSONAL LINK</p><h1>Get anonymous messages you’ll want to share.</h1><p>Pick your link. Choose a private creator key. Then share it anywhere.</p><form onSubmit={create} noValidate><label htmlFor="handle">Your custom link</label><div className="handle-field"><span>vaulter.live/m/</span><input id="handle" value={handle} onChange={(event) => setHandle(event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))} placeholder="yourname" minLength={3} maxLength={30} required /></div><label htmlFor="creator-key-new">Creator key</label><input id="creator-key-new" type="password" value={key} onChange={(event) => setKey(event.target.value)} placeholder="At least 8 characters" minLength={8} required /><small>This is how you privately open your response dashboard.</small><button type="submit" disabled={saving}>{saving ? "Creating your link…" : "Create my Vaulter link"}</button>{error && <p className="creator-error" role="alert">{error}</p>}</form></section>;
}
