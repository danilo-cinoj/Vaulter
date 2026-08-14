import "server-only";
import { createHmac, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "vaulter_creator_session";
const MAX_AGE_SECONDS = 60 * 60 * 12;

function sessionSecret() {
  const secret = process.env.DASHBOARD_SESSION_SECRET;
  if (!secret) throw new Error("DASHBOARD_SESSION_SECRET is not configured.");
  return secret;
}

function sign(value: string) {
  return createHmac("sha256", sessionSecret()).update(value).digest("base64url");
}

export function hashCreatorKey(key: string, handle: string) {
  return scryptSync(key, `${handle}:${sessionSecret()}`, 64).toString("hex");
}

export function creatorKeyIsValid(key: string, handle: string, storedHash: string) {
  const received = Buffer.from(hashCreatorKey(key, handle), "hex");
  const expected = Buffer.from(storedHash, "hex");
  return received.length === expected.length && timingSafeEqual(received, expected);
}

export function createDashboardSession(handle: string) {
  const payload = Buffer.from(JSON.stringify({ createdAt: Date.now(), handle })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function dashboardCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  };
}

export function getDashboardSession(): { handle: string } | null {
  const raw = cookies().get(COOKIE_NAME)?.value;
  if (!raw) return null;
  const [payload, signature] = raw.split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload);
  const expectedBytes = Buffer.from(expected);
  const signatureBytes = Buffer.from(signature);
  if (expectedBytes.length !== signatureBytes.length || !timingSafeEqual(expectedBytes, signatureBytes)) return null;
  try {
    const { createdAt, handle } = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (typeof createdAt !== "number" || typeof handle !== "string" || Date.now() - createdAt >= MAX_AGE_SECONDS * 1000) return null;
    return { handle };
  } catch {
    return null;
  }
}

export const dashboardCookieName = COOKIE_NAME;
