import { db } from "@/lib/db";
import { MAX_LEN, PER_DAY, canEditDate } from "@/lib/rules";
import { currentUser, fail, json, todayKST } from "@/lib/server";


export async function POST(req: Request) {
  const user = await currentUser(req);
  if (!user) return fail("로그인이 필요해요.", 401);
  const { date, content: raw } = await req.json().catch(() => ({}));
  const content = String(raw ?? "").trim();
  if (!content) return fail("감사 내용을 적어주세요.");
  if (content.length > MAX_LEN) return fail(`${MAX_LEN}자까지 쓸 수 있어요.`);
  if (!canEditDate(todayKST(req), String(date))) return fail("지금은 이 날짜에 쓸 수 없어요.", 403);

  const [{ n }] = await db<{ n: number }>(
    "select count(*)::int as n from entries where user_id = $1 and entry_date = $2",
    [user.id, date],
  );
  if (n >= PER_DAY) return fail(`하루에 ${PER_DAY}개까지 쓸 수 있어요.`);
  const [entry] = await db(
    "insert into entries (user_id, entry_date, content) values ($1, $2, $3) returning id, entry_date::text as date, content",
    [user.id, date, content],
  );
  return json({ entry });
}
