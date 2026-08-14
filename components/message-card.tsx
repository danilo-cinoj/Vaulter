"use client";

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";

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
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const uploadInput = useRef<HTMLInputElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!image) return setPreview("");
    const url = URL.createObjectURL(image);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  function chooseImage(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    if (!selected) return;
    if (!/^image\/(jpeg|png|webp)$/.test(selected.type)) return setError("Use a JPG, PNG, or WebP image.");
    if (selected.size > 8 * 1024 * 1024) return setError("Choose an image smaller than 8 MB.");
    setImage(selected);
    setError("");
  }

  function pickPrompt() {
    const next = (promptIndex + 1) % prompts.length;
    setPromptIndex(next);
    setMessage(prompts[next]);
    setError("");
  }

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = message.trim();
    if (!trimmed && !image) return setError("Write a message or add an image before sending.");
    if (trimmed.length > 300) return setError("Keep your message under 300 characters.");
    setStatus("sending");
    setError("");
    const formData = new FormData(event.currentTarget);
    formData.set("body", trimmed);
    if (image) formData.set("image", image);
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        body: formData,
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
    setImage(null);
    if (uploadInput.current) uploadInput.current.value = "";
    if (cameraInput.current) cameraInput.current.value = "";
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
            <input ref={uploadInput} className="sr-only" id="image-upload" type="file" name="image" accept="image/jpeg,image/png,image/webp" onChange={chooseImage} disabled={status === "sending"} />
            <input ref={cameraInput} className="sr-only" id="camera-upload" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={chooseImage} disabled={status === "sending"} />
            <input className="honeypot" aria-hidden="true" tabIndex={-1} name="website" autoComplete="off" />
            {preview && <div className="image-preview"><img src={preview} alt="Selected image preview" /><button type="button" onClick={() => setImage(null)} aria-label="Remove selected image">×</button></div>}
            <div className="composer-tools">
              <span className="counter" aria-live="polite">{message.length}/300</span>
              <button className="dice-button" type="button" onClick={pickPrompt} aria-label="Suggest a message idea" title="Suggest a message idea">⚄</button>
            </div>
            <div className="image-actions">
              <button type="button" onClick={() => uploadInput.current?.click()} disabled={status === "sending"}>Add photo</button>
              <button type="button" onClick={() => cameraInput.current?.click()} disabled={status === "sending"}>Take photo</button>
            </div>
          </div>
        )}
      </div>
      {status !== "sent" && <button className="send-button" type="submit" disabled={status === "sending"}>{status === "sending" ? "Sending…" : "Send anonymously"}</button>}
      {error && <p className="form-error" role="alert">{error}</p>}
    </form>
  );
}
