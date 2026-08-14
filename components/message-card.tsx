"use client";

import { FormEvent, useState } from "react";

const prompts = [
  "what’s something you’ve always wanted to tell me?",
  "what do you think I should know?",
  "what’s your first impression of me?",
  "what’s a question you’ve been meaning to ask?",
  "do u believe in second chances?",
];

export function MessageCard() {
  const [message, setMessage] = useState("");
  const [promptIndex, setPromptIndex] = useState(prompts.length - 1);
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");

  function pickPrompt() {
    const next = (promptIndex + 1) % prompts.length;
    setPromptIndex(next);
    setMessage(prompts[next]);
    setError("");
  }

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) return setError("Write a message before sending.");
    if (trimmed.length > 300) return setError("Keep your message under 300 characters.");
    setStatus("sending");
    setError("");
    const website = new FormData(event.currentTarget).get("website");
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: trimmed, website }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to send message.");
      setStatus("sent");
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unable to send message.");
      setStatus("idle");
    }
  }

  function startAgain() {
    setMessage("");
    setError("");
    setStatus("idle");
  }

  return (
    <form className="message-form" onSubmit={send} noValidate>
      <div className="message-card">
        <header className="message-header">
          <span className="avatar" aria-hidden="true">◉</span>
          <div><p>@danilocinoj</p><h1>send me anonymous messages!</h1></div>
        </header>
        {status === "sent" ? (
          <div className="composer success-state" role="status" aria-live="polite">
            <span aria-hidden="true">✦</span><strong>Sent anonymously ✨</strong>
            <button type="button" className="text-button" onClick={startAgain}>Send another</button>
          </div>
        ) : (
          <div className="composer">
            <label className="sr-only" htmlFor="anonymous-message">Your anonymous message</label>
            <textarea id="anonymous-message" value={message} maxLength={300} onChange={(event) => { setMessage(event.target.value); setError(""); }} placeholder={prompts[promptIndex]} disabled={status === "sending"} />
            <input className="honeypot" aria-hidden="true" tabIndex={-1} name="website" autoComplete="off" />
            <div className="composer-tools">
              <span className="counter" aria-live="polite">{message.length}/300</span>
              <button className="dice-button" type="button" onClick={pickPrompt} aria-label="Suggest a message idea" title="Suggest a message idea">⚄</button>
            </div>
          </div>
        )}
      </div>
      {status !== "sent" && <button className="send-button" type="submit" disabled={status === "sending"}>{status === "sending" ? "Sending…" : "Send anonymously"}</button>}
      {error && <p className="form-error" role="alert">{error}</p>}
    </form>
  );
}
