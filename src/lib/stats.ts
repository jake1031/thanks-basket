import "server-only";
import { db } from "./db";
import { WEEKDAYS, WEEKEND, isFruitId, tierFor, unlockedFruits, type FruitId } from "./rules";

export type UserStat = {
  id: number;
  nickname: string;
  count: number; // 평일 감사 개수 (0~15)
  bonus: number; // 토요일 보너스 감사 개수
  tier: number; // 열매 단계 1~5 (실제 선물 기준)
  fruit: FruitId; // 바구니에 넣은 열매 → 내가 고른 열매 → 내 단계의 첫 열매
  golden: boolean;
  placed: boolean;
  placedAt: string | null;
  byDay: Record<string, number>;
};

export async function userStats(userId?: number): Promise<UserStat[]> {
  const users = await db<{ id: number; nickname: string; placed: boolean; placedAt: string | null; picked: string | null; pref: string | null }>(
    `select u.id, u.nickname, (b.user_id is not null) as placed, b.placed_at::text as "placedAt", b.fruit as picked, u.pick as pref
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
    const tier = tierFor(count);
    const { picked, pref, ...rest } = u;
    // 바구니에 넣었으면 넣은 열매, 아니면 내가 고른 열매, 그것도 없으면 내 단계의 첫 열매
    const open = unlockedFruits(count);
    const fruit = isFruitId(picked) && open.includes(picked) ? picked
      : isFruitId(pref) && open.includes(pref) ? pref
      : tier.fruits[0];
    return { ...rest, count, bonus, tier: tier.level, fruit, golden: bonus > 0, byDay };
  });
}
