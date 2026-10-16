import { db } from "@/lib/db";
import { basketOpen, isFruitId, unlockedFruits } from "@/lib/rules";
import { currentUser, fail, json, todayKST } from "@/lib/server";
import { userStats } from "@/lib/stats";

export async function GET(req: Request) {
  const user = await currentUser(req);
  if (!user) return fail("로그인이 필요해요.", 401);
  const stats = await userStats();
  const open = basketOpen(todayKST(req));
  // 바구니가 열리기 전(평일)에는 넣은 기록이 있어도 비어 있는 것으로 보여준다
  const placed = !open ? [] : stats
    .filter((s) => s.placed)
    .sort((a, b) => (a.placedAt! < b.placedAt! ? -1 : 1))
    .map((s) => ({ fruit: s.fruit, golden: s.golden, mine: s.id === user.id }));
  return json({
    today: todayKST(req),
    open,
    placed,
    members: stats.length,
    totalThanks: stats.reduce((s, u) => s + u.count + u.bonus, 0),
  });
}

export async function POST(req: Request) {
  const user = await currentUser(req);
  if (!user) return fail("로그인이 필요해요.", 401);
  if (!basketOpen(todayKST(req))) return fail("바구니는 토요일부터 열려요.", 403);
  const { fruit } = await req.json().catch(() => ({}));
  const [me] = await userStats(user.id);
  if (!isFruitId(fruit) || !unlockedFruits(me.count).includes(fruit)) return fail("아직 해금되지 않은 열매예요.");
  await db("insert into basket (user_id, fruit) values ($1, $2) on conflict do nothing", [user.id, fruit]);
  return json({ ok: true });
}
