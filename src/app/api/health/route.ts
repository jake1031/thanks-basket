import { db } from "@/lib/db";
import { fail, isAdmin, json } from "@/lib/server";

// 배포 점검용: 관리자 비밀번호가 맞을 때만 DB 연결 상태와 오류 내용을 알려준다
export async function GET(req: Request) {
  if (!isAdmin(req)) return fail("관리자 비밀번호가 필요해요.", 401);
  const url = process.env.DATABASE_URL ?? "";
  let host = "";
  try { host = url ? `${new URL(url).hostname}:${new URL(url).port}` : "(없음)"; } catch { host = "(주소 형식 오류)"; }
  try {
    const [r] = await db<{ n: number }>("select count(*)::int as n from users");
    return json({ ok: true, host, users: r.n });
  } catch (e) {
    const err = e as { code?: string; message?: string };
    return json({ ok: false, host, code: err.code ?? null, message: err.message ?? String(e) }, 500);
  }
}
