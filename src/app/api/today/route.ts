import { db } from "@/lib/db";
import { EVENT_DAYS } from "@/lib/rules";
import { currentUser, fail, json, todayKST } from "@/lib/server";

// 오늘 감사를 남긴 사람들 (닉네임과 개수만, 내용은 보내지 않음). 먼저 쓴 사람 순.
export async function GET(req: Request) {
  const user = await currentUser(req);
  if (!user) return fail("로그인이 필요해요.", 401);
  const today = todayKST(req);
  if (!EVENT_DAYS.includes(today)) return json({ date: today, people: [] });
  const rows = await db<{ user_id: number; nickname: string; n: number }>(
    `select e.user_id, u.nickname, count(*)::int as n, min(e.id) as first
       from entries e join users u on u.id = e.user_id
      where e.entry_date = $1
      group by e.user_id, u.nickname
      order by first`,
    [today],
  );
  return json({ date: today, people: rows.map((r) => ({ nickname: r.nickname, n: r.n, mine: r.user_id === user.id })) });
}
