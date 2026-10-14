import "server-only";
import { db } from "./db";
import { WEEKDAYS, WEEKEND, fruitFor } from "./rules";

export type UserStat = {
  id: number;
  nickname: string;
  count: number; // 평일 감사 개수 (0~15)
  bonus: number; // 주말 감사 개수
  fruit: ReturnType<typeof fruitFor>["id"];
  golden: boolean;
  placed: boolean;
  placedAt: string | null;
  byDay: Record<string, number>;
};

export async function userStats(userId?: number): Promise<UserStat[]> {
  const users = await db<{ id: number; nickname: string; placed: boolean; placedAt: string | null }>(
    `select u.id, u.nickname, (b.user_id is not null) as placed, b.placed_at::text as "placedAt"
       from users u left join basket b on b.user_id = u.id
      ${userId ? "where u.id = $1" : ""}
      order by u.nickname`,
    userId ? [userId] : [],
  );
  const counts = await db<{ user_id: number; d: string; n: number }>(
    `select user_id, entry_date::text as d, count(*)::int as n from entries
      ${userId ? "where user_id = $1" : ""} group by user_id, entry_date`,
    userId ? [userId] : [],
  );
  return users.map((u) => {
    const byDay: Record<string, number> = {};
    for (const c of counts) if (c.user_id === u.id) byDay[c.d] = c.n;
    const count = WEEKDAYS.reduce((s, d) => s + Math.min(byDay[d] ?? 0, 3), 0);
    const bonus = WEEKEND.reduce((s, d) => s + (byDay[d] ?? 0), 0);
    return { ...u, count, bonus, fruit: fruitFor(count).id, golden: bonus > 0, byDay };
  });
}
