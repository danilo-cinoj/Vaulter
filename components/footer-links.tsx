"use client";

import { useState } from "react";

export function FooterLinks() {
  const [open, setOpen] = useState<"Terms" | "Privacy" | null>(null);
  return <>
    <div className="footer-links"><button onClick={() => setOpen("Terms")}>Terms</button><button onClick={() => setOpen("Privacy")}>Privacy</button></div>
    {open && <div className="modal-backdrop" role="presentation" onMouseDown={() => setOpen(null)}><section className="legal-modal" role="dialog" aria-modal="true" aria-labelledby="legal-title" onMouseDown={(e) => e.stopPropagation()}><button className="close-modal" onClick={() => setOpen(null)} aria-label="Close">×</button><h2 id="legal-title">{open}</h2><p>{open === "Terms" ? "Vaulter is an early-access service. Please use it respectfully and do not submit unlawful, harmful, or abusive content." : "Vaulter collects only the message or contact details you choose to submit. We use waitlist contact details solely for launch updates."}</p></section></div>}
  </>;
}
