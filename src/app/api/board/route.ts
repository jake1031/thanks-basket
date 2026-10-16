import { db } from "@/lib/db";
import { EVENT_DAYS } from "@/lib/rules";
import { currentUser, fail, json } from "@/lib/server";

// 감사 게시판: 날짜별로 사람마다 한 장씩 (닉네임과 함께)
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

  const rows = await db<{ user_id: number; nickname: string; content: string }>(
    `select e.user_id, u.nickname, e.content from entries e join users u on u.id = e.user_id
      where e.entry_date = $1 order by e.id`,
    [date],
  );
  // 먼저 쓴 사람 순서로 한 장씩 묶는다
  const byUser = new Map<number, { userId: number; nickname: string; mine: boolean; entries: string[]; comments: number }>();
  for (const r of rows) {
    if (!byUser.has(r.user_id)) byUser.set(r.user_id, { userId: r.user_id, nickname: r.nickname, mine: r.user_id === user.id, entries: [], comments: 0 });
    byUser.get(r.user_id)!.entries.push(r.content);
  }
  const cc = await db<{ target_user_id: number; n: number }>(
    "select target_user_id, count(*)::int as n from comments where entry_date = $1 group by target_user_id",
    [date],
  );
  for (const c of cc) { const card = byUser.get(c.target_user_id); if (card) card.comments = c.n; }
  const cards = [...byUser.values()];
  return json({ people, cards });
}
