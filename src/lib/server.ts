import "server-only";
import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "./db";

export const DEV = process.env.NODE_ENV === "development";

/**
 * 현재 한국 날짜 'YYYY-MM-DD'.
 * 개발 모드에서만 날짜 미리보기 쿠키(dev_date)나 FAKE_NOW로 날짜를 바꿀 수 있다.
 */
export function todayKST(req?: Request): string {
  if (DEV) {
    const cookie = req?.headers.get("cookie")?.match(/(?:^|;\s*)dev_date=(\d{4}-\d{2}-\d{2})/)?.[1];
    if (cookie) return cookie;
    if (process.env.FAKE_NOW) return process.env.FAKE_NOW.slice(0, 10);
  }
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
}

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}
export function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function hashPin(pin: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(pin, salt, 32).toString("hex");
  return `${salt}:${hash}`;
}
export function verifyPin(pin: string, stored: string) {
  const [salt, hash] = stored.split(":");
  const test = crypto.scryptSync(pin, salt, 32);
  return crypto.timingSafeEqual(test, Buffer.from(hash, "hex"));
}

const sha = (s: string) => crypto.createHash("sha256").update(s).digest("hex");

export async function createSession(userId: number) {
  const token = crypto.randomBytes(24).toString("base64url");
  await db("insert into sessions (token_hash, user_id) values ($1, $2)", [sha(token), userId]);
  return token;
}

export async function deleteSession(req: Request) {
  const token = bearer(req);
  if (token) await db("delete from sessions where token_hash = $1", [sha(token)]);
}

function bearer(req: Request) {
  const h = req.headers.get("authorization") ?? "";
  return h.startsWith("Bearer ") ? h.slice(7) : null;
}

export async function currentUser(req: Request) {
  const token = bearer(req);
  if (!token) return null;
  const rows = await db<{ id: number; nickname: string }>(
    "select u.id, u.nickname from sessions s join users u on u.id = s.user_id where s.token_hash = $1",
    [sha(token)],
  );
  return rows[0] ?? null;
}

export function isAdmin(req: Request) {
  const pw = process.env.ADMIN_PASSWORD;
  const given = req.headers.get("x-admin-password");
  if (!pw || !given) return false;
  const a = Buffer.from(sha(pw)), b = Buffer.from(sha(given));
  return crypto.timingSafeEqual(a, b);
}
