import { db } from "@/lib/db";
import { EVENT_DAYS } from "@/lib/rules";
import { currentUser, fail, json } from "@/lib/server";

// 익명 감사 게시판: 날짜별로 사람마다 한 장씩 (작성자는 노출하지 않고 본인 여부만 표시)
export async function GET(req: Request) {
  const user = await currentUser(req);
  if (!user) return fail("로그인이 필요해요.", 401);
  const date = new URL(req.url).searchParams.get("date") ?? "";

  const counts = await db<{ d: string; n: number }>(
    "select entry_date::text as d, count(distinct user_id)::int as n from entries group by entry_date",
  );
  const people: Record<string, number> = {};
  for (const c of counts) if (EVENT_DAYS.includes(c.d)) people[c.d] = c.n;

  if (!EVENT_DAYS.includes(date)) return json({ people, cards: [] });

  const rows = await db<{ user_id: number; content: string }>(
    "select user_id, content from entries where entry_date = $1 order by id",
    [date],
  );
  // 먼저 쓴 사람 순서로 한 장씩 묶는다
  const byUser = new Map<number, string[]>();
  for (const r of rows) {
    if (!byUser.has(r.user_id)) byUser.set(r.user_id, []);
    byUser.get(r.user_id)!.push(r.content);
  }
  const cards = [...byUser.entries()].map(([uid, entries]) => ({ mine: uid === user.id, entries }));
  return json({ people, cards });
}
