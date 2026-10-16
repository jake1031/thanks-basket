import { db } from "@/lib/db";
import { COMMENT_LEN, EVENT_DAYS } from "@/lib/rules";
import { currentUser, fail, json, todayKST } from "@/lib/server";

type Row = { id: number; nickname: string; content: string; mine: boolean; created_at: string };

async function list(targetId: number, date: string, me: number) {
  return db<Row>(
    `select c.id, u.nickname, c.content, (c.author_id = $3) as mine, c.created_at::text as created_at
       from comments c join users u on u.id = c.author_id
      where c.target_user_id = $1 and c.entry_date = $2 order by c.id`,
    [targetId, date, me],
  );
}

// 게시판 카드(사람·날짜)에 달린 댓글
export async function GET(req: Request) {
  const user = await currentUser(req);
  if (!user) return fail("로그인이 필요해요.", 401);
  const q = new URL(req.url).searchParams;
  const targetId = Number(q.get("target")), date = q.get("date") ?? "";
  if (!targetId || !EVENT_DAYS.includes(date)) return fail("잘못된 요청이에요.");
  return json({ comments: await list(targetId, date, user.id) });
}

export async function POST(req: Request) {
  const user = await currentUser(req);
  if (!user) return fail("로그인이 필요해요.", 401);
  const { target, date, content: raw } = await req.json().catch(() => ({}));
  const content = String(raw ?? "").trim();
  const targetId = Number(target);
  if (!content) return fail("댓글 내용을 적어주세요.");
  if (content.length > COMMENT_LEN) return fail(`${COMMENT_LEN}자까지 쓸 수 있어요.`);
  if (!targetId || !EVENT_DAYS.includes(String(date)) || String(date) > todayKST(req)) return fail("지금은 이 카드에 댓글을 달 수 없어요.", 403);
  const [has] = await db("select 1 from entries where user_id = $1 and entry_date = $2 limit 1", [targetId, date]);
  if (!has) return fail("감사 카드를 찾을 수 없어요.", 404);
  await db("insert into comments (target_user_id, entry_date, author_id, content) values ($1, $2, $3, $4)", [targetId, date, user.id, content]);
  return json({ comments: await list(targetId, String(date), user.id) });
}
