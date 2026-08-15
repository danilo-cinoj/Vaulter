"use client";

import { FormEvent, useState } from "react";

export function DashboardAccess() {
  const [handle, setHandle] = useState("");

  function openDashboard(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleaned = handle.toLowerCase().replace(/^@/, "").replace(/[^a-z0-9_]/g, "");
    if (cleaned) window.location.assign(`/dashboard/${cleaned}`);
  }

  return <main className="dashboard-page"><section className="dashboard-lock"><img src="/vaulter-orange-black.svg" alt="Vaulter" /><p className="eyebrow">CREATOR ACCESS</p><h1>Open your messages.</h1><p>Enter the custom name from your Vaulter link.</p><form onSubmit={openDashboard}><label htmlFor="dashboard-handle">Your link name</label><div className="dashboard-handle-field"><span>vaulter.live/m/</span><input id="dashboard-handle" value={handle} onChange={(event) => setHandle(event.target.value)} placeholder="yourname" autoComplete="username" required /></div><button type="submit">Continue to dashboard</button></form></section></main>;
}
