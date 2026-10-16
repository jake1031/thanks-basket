import { db } from "@/lib/db";
import { isFruitId, unlockedFruits } from "@/lib/rules";
import { currentUser, fail, json, todayKST } from "@/lib/server";
import { userStats } from "@/lib/stats";

export async function GET(req: Request) {
  const user = await currentUser(req);
  if (!user) return fail("로그인이 필요해요.", 401);
  const entries = await db(
    "select id, entry_date::text as date, content from entries where user_id = $1 order by entry_date, id",
    [user.id],
  );
  const [stat] = await userStats(user.id);
  return json({ today: todayKST(req), user: stat, entries });
}

// 내 열매 바꾸기 (해금된 열매 중에서, 바구니에 넣기 전까지)
export async function POST(req: Request) {
  const user = await currentUser(req);
  if (!user) return fail("로그인이 필요해요.", 401);
  const { fruit } = await req.json().catch(() => ({}));
  const [me] = await userStats(user.id);
  if (me.placed) return fail("이미 바구니에 넣은 열매는 바꿀 수 없어요.", 403);
  if (!isFruitId(fruit) || !unlockedFruits(me.count).includes(fruit)) return fail("아직 열리지 않은 열매예요.");
  await db("update users set pick = $2 where id = $1", [user.id, fruit]);
  const [stat] = await userStats(user.id);
  return json({ user: stat });
}
