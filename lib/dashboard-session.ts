import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
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

export function accessKeyIsValid(key: unknown) {
  const expected = process.env.DASHBOARD_ACCESS_KEY;
  if (!expected || typeof key !== "string") return false;
  const expectedBytes = Buffer.from(expected);
  const receivedBytes = Buffer.from(key);
  return expectedBytes.length === receivedBytes.length && timingSafeEqual(expectedBytes, receivedBytes);
}

export function createDashboardSession() {
  const payload = Buffer.from(JSON.stringify({ createdAt: Date.now() })).toString("base64url");
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

export function hasDashboardSession() {
  const raw = cookies().get(COOKIE_NAME)?.value;
  if (!raw) return false;
  const [payload, signature] = raw.split(".");
  if (!payload || !signature) return false;
  const expected = sign(payload);
  const expectedBytes = Buffer.from(expected);
  const signatureBytes = Buffer.from(signature);
  if (expectedBytes.length !== signatureBytes.length || !timingSafeEqual(expectedBytes, signatureBytes)) return false;
  try {
    const { createdAt } = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return typeof createdAt === "number" && Date.now() - createdAt < MAX_AGE_SECONDS * 1000;
  } catch {
    return false;
  }
}

export const dashboardCookieName = COOKIE_NAME;
