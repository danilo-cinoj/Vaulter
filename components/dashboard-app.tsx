"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type VaultMessage = {
  id: string;
  body: string | null;
  created_at: string;
  image_path: string | null;
  image_content_type: string | null;
  imageUrl: string | null;
};

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(value));
}

function drawRoundedRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
  context.closePath();
}

function wrapText(context: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const proposed = line ? `${line} ${word}` : word;
    if (context.measureText(proposed).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else line = proposed;
  }
  if (line) lines.push(line);
  return lines;
}

async function loadCanvasImage(url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Couldn’t prepare this photo.");
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  try {
    const image = new Image();
    image.src = objectUrl;
    await image.decode();
    return image;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function makeStory(message: VaultMessage) {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1920;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Your browser can’t create the story image.");

  context.fillStyle = "#0d0d0d";
  context.fillRect(0, 0, canvas.width, canvas.height);
  const cardX = 82;
  const cardWidth = 916;
  const cardY = 565;
  const cardHeight = 665;

  context.save();
  context.shadowColor = "rgba(0, 0, 0, .42)";
  context.shadowBlur = 42;
  context.shadowOffsetY = 20;
  drawRoundedRect(context, cardX, cardY, cardWidth, cardHeight, 72);
  context.fillStyle = "#fdfdfd";
  context.fill();
  context.restore();

  const header = context.createLinearGradient(cardX, cardY, cardX + cardWidth, cardY + 220);
  header.addColorStop(0, "#ff7a27");
  header.addColorStop(.55, "#ff4d1f");
  header.addColorStop(1, "#ff1c12");
  drawRoundedRect(context, cardX, cardY - 65, cardWidth, 255, 112);
  context.fillStyle = header;
  context.fill();

  context.fillStyle = "#fff";
  context.textAlign = "center";
  context.font = "50px 'Hammersmith One', Arial, sans-serif";
  context.fillText("Send me anonymous messages!", 540, cardY + 78);

  const copy = message.body?.trim() || "an anonymous visual message ✦";
  context.fillStyle = "#0d0d0d";
  context.textAlign = "left";
  context.font = "600 48px Arial, sans-serif";
  const lines = wrapText(context, copy, message.imageUrl ? 470 : 710).slice(0, 6);
  let y = cardY + 258;
  for (const line of lines) {
    context.fillText(line, cardX + 85, y);
    y += 63;
  }

  if (message.imageUrl) {
    try {
      const image = await loadCanvasImage(message.imageUrl);
      context.save();
      context.translate(760, cardY + 390);
      context.rotate(.075);
      context.fillStyle = "#fff";
      context.shadowColor = "rgba(0,0,0,.18)";
      context.shadowBlur = 18;
      context.shadowOffsetY = 9;
      context.fillRect(-155, -205, 310, 366);
      context.shadowColor = "transparent";
      context.save();
      context.beginPath();
      context.rect(-135, -185, 270, 270);
      context.clip();
      const scale = Math.max(270 / image.width, 270 / image.height);
      context.drawImage(image, -image.width * scale / 2, -image.height * scale / 2, image.width * scale, image.height * scale);
      context.restore();
      context.fillStyle = "#ff7227";
      context.font = "28px 'Hammersmith One', Arial, sans-serif";
      context.textAlign = "center";
      context.fillText("anonymous photo", 0, 125);
      context.restore();
    } catch {
      // A text-only story is still useful if a signed image URL has expired.
    }
  }

  context.strokeStyle = "#ff7227";
  context.lineWidth = 10;
  context.beginPath();
  context.moveTo(370, 1590); context.lineTo(370, 1657); context.lineTo(429, 1619); context.lineTo(392, 1694); context.lineTo(346, 1651); context.lineTo(346, 1590); context.lineTo(370, 1614);
  context.stroke();
  context.fillStyle = "#fdfdfd";
  context.textAlign = "left";
  context.font = "68px Georgia, serif";
  context.fillText("Vaulter", 454, 1668);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("Couldn’t create the story image.");
  return new File([blob], "vaulter-anonymous-response.png", { type: "image/png" });
}

export function DashboardApp() {
  const [messages, setMessages] = useState<VaultMessage[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [state, setState] = useState<"loading" | "locked" | "ready">("loading");
  const [key, setKey] = useState("");
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);
  const selected = useMemo(() => messages.find((message) => message.id === selectedId) ?? messages[0] ?? null, [messages, selectedId]);

  async function loadMessages() {
    setState("loading");
    const response = await fetch("/api/dashboard/messages", { cache: "no-store" });
    if (response.status === 401) return setState("locked");
    const result = await response.json();
    if (!response.ok) {
      setError(result.error || "Couldn’t open the vault.");
      return setState("locked");
    }
    setMessages(result.messages);
    setSelectedId(result.messages[0]?.id ?? null);
    setState("ready");
  }

  useEffect(() => { void loadMessages(); }, []);

  async function unlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const response = await fetch("/api/dashboard/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key }) });
    const result = await response.json();
    if (!response.ok) return setError(result.error || "Couldn’t unlock the vault.");
    setKey("");
    void loadMessages();
  }

  async function exportStory(share: boolean) {
    if (!selected) return;
    setExporting(true);
    setError("");
    try {
      const image = await makeStory(selected);
      if (share && navigator.canShare?.({ files: [image] })) {
        await navigator.share({ files: [image], title: "Anonymous message" });
      } else {
        const url = URL.createObjectURL(image);
        const link = document.createElement("a");
        link.href = url;
        link.download = image.name;
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch (storyError) {
      setError(storyError instanceof Error ? storyError.message : "Couldn’t create the story image.");
    } finally {
      setExporting(false);
    }
  }

  if (state === "loading") return <main className="dashboard-page"><p className="dashboard-loading">Opening your vault…</p></main>;
  if (state === "locked") return <main className="dashboard-page"><section className="dashboard-lock"><img src="/vaulter-orange-black.svg" alt="Vaulter" /><p className="eyebrow">CREATOR VAULT</p><h1>Your responses, privately.</h1><p>Enter your creator key to view anonymous messages and turn one into a story image.</p><form onSubmit={unlock}><label htmlFor="creator-key">Creator key</label><input id="creator-key" type="password" value={key} onChange={(event) => setKey(event.target.value)} autoComplete="current-password" required /><button type="submit">Unlock the vault</button>{error && <p className="dashboard-error" role="alert">{error}</p>}</form></section></main>;

  return <main className="dashboard-page"><div className="dashboard-top"><div><img src="/vaulter-orange-white.svg" alt="Vaulter" /><p>CREATOR VAULT · @danilocinoj</p></div><button className="logout-button" onClick={async () => { await fetch("/api/dashboard/logout", { method: "POST" }); void loadMessages(); }}>Lock vault</button></div><section className="dashboard-grid"><aside className="response-list"><div className="list-heading"><div><p className="eyebrow">INBOX</p><h1>{messages.length} response{messages.length === 1 ? "" : "s"}</h1></div></div>{messages.length === 0 ? <p className="empty-vault">Your first anonymous response will appear here.</p> : messages.map((message) => <button key={message.id} className={`response-row ${message.id === selected?.id ? "selected" : ""}`} onClick={() => setSelectedId(message.id)}><span className="response-row-copy">{message.body?.trim() || "Anonymous photo"}</span>{message.imageUrl && <span className="photo-stack"><img src={message.imageUrl} alt="Attached anonymous photo" /></span>}<time>{dateLabel(message.created_at)}</time></button>)}</aside><section className="story-studio"><div className="studio-heading"><div><p className="eyebrow">STORY MAKER</p><h2>Ready to share</h2></div><p>Exported at 1080 × 1920</p></div>{selected ? <><div className="story-preview" aria-label="Instagram story preview"><div className="story-card"><div className="story-banner">Send me anonymous messages!</div><div className="story-response"><p>{selected.body?.trim() || "an anonymous visual message ✦"}</p>{selected.imageUrl && <div className="story-polaroid"><img src={selected.imageUrl} alt="Anonymous submitted photo" /><span>anonymous photo</span></div>}</div></div><div className="story-brand"><span>⌁</span> Vaulter</div></div><div className="story-actions"><button onClick={() => void exportStory(false)} disabled={exporting}>{exporting ? "Creating…" : "Download story"}</button><button className="share-button" onClick={() => void exportStory(true)} disabled={exporting}>{exporting ? "Creating…" : "Share story"}</button></div></> : <div className="empty-story">Choose a response to make a story.</div>}{error && <p className="dashboard-error" role="alert">{error}</p>}</section></section></main>;
}
