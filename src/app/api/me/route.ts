import { db } from "@/lib/db";
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
