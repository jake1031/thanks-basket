import { db } from "@/lib/db";
import { fail, hashPin, isAdmin, json, todayKST } from "@/lib/server";
import { userStats } from "@/lib/stats";

export async function GET(req: Request) {
  if (!isAdmin(req)) return fail("관리자 비밀번호가 틀렸어요.", 401);
  const entries = await db(
    `select e.id, e.entry_date::text as date, e.content, u.nickname
       from entries e join users u on u.id = e.user_id order by e.id desc`,
  );
  const names = await db<{ id: number; real_name: string }>("select id, real_name from users");
  const nameOf = new Map(names.map((n) => [n.id, n.real_name]));
  const users = (await userStats()).map((u) => ({ ...u, realName: nameOf.get(u.id) ?? "" }));
  const comments = await db(
    `select c.id, c.entry_date::text as date, c.content, a.nickname as author, t.nickname as target
       from comments c join users a on a.id = c.author_id join users t on t.id = c.target_user_id
      order by c.id desc`,
  );
  return json({ today: todayKST(req), users, entries, comments });
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
    case "delete-comment":
      await db("delete from comments where id = $1", [body.id]);
      return json({ ok: true });
    case "place-all": {
      // 감사를 1개 이상 썼는데 바구니에 안 넣은 사람: 고른 열매(없으면 내 단계 첫 열매)로 대신 넣는다
      const todo = (await userStats()).filter((u) => !u.placed && u.count + u.bonus > 0);
      for (const u of todo) {
        await db("insert into basket (user_id, fruit) values ($1, $2) on conflict do nothing", [u.id, u.fruit]);
      }
      return json({ ok: true, placed: todo.length });
    }
    case "delete-user":
      await db("delete from users where id = $1", [body.userId]);
      return json({ ok: true });
    default:
      return fail("알 수 없는 요청이에요.");
  }
}
