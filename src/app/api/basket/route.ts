import { db } from "@/lib/db";
import { basketOpen } from "@/lib/rules";
import { currentUser, fail, json, todayKST } from "@/lib/server";
import { userStats } from "@/lib/stats";

export async function GET(req: Request) {
  const user = await currentUser(req);
  if (!user) return fail("로그인이 필요해요.", 401);
  const stats = await userStats();
  const placed = stats
    .filter((s) => s.placed)
    .sort((a, b) => (a.placedAt! < b.placedAt! ? -1 : 1))
    .map((s) => ({ fruit: s.fruit, golden: s.golden, mine: s.id === user.id }));
  return json({
    today: todayKST(),
    open: basketOpen(todayKST()),
    placed,
    members: stats.length,
    totalThanks: stats.reduce((s, u) => s + u.count + u.bonus, 0),
  });
}

export async function POST(req: Request) {
  const user = await currentUser(req);
  if (!user) return fail("로그인이 필요해요.", 401);
  if (!basketOpen(todayKST())) return fail("바구니는 토요일부터 열려요.", 403);
  await db("insert into basket (user_id) values ($1) on conflict do nothing", [user.id]);
  return json({ ok: true });
}
