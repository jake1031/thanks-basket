import { db } from "@/lib/db";
import { fail, hashPin, isAdmin, json, todayKST } from "@/lib/server";
import { userStats } from "@/lib/stats";

export async function GET(req: Request) {
  if (!isAdmin(req)) return fail("관리자 비밀번호가 틀렸어요.", 401);
  const entries = await db(
    `select e.id, e.entry_date::text as date, e.content, u.nickname
       from entries e join users u on u.id = e.user_id order by e.id desc`,
  );
  return json({ today: todayKST(req), users: await userStats(), entries });
}

export async function POST(req: Request) {
  if (!isAdmin(req)) return fail("관리자 비밀번호가 틀렸어요.", 401);
  const body = await req.json().catch(() => ({}));
  switch (body.action) {
    case "reset-pin":
      if (!/^\d{4}$/.test(String(body.pin))) return fail("PIN은 숫자 4자리예요.");
      await db("update users set pin_hash = $2, failed_count = 0, locked_until = null where id = $1", [
        body.userId,
        hashPin(String(body.pin)),
      ]);
      return json({ ok: true });
    case "delete-entry":
      await db("delete from entries where id = $1", [body.id]);
      return json({ ok: true });
    case "delete-user":
      await db("delete from users where id = $1", [body.userId]);
      return json({ ok: true });
    default:
      return fail("알 수 없는 요청이에요.");
  }
}
