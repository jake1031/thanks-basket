import { db } from "@/lib/db";
import { currentUser, fail, json } from "@/lib/server";

// 익명 감사 게시판: 작성자는 노출하지 않는다 (본인 글 여부만 표시)
export async function GET(req: Request) {
  const user = await currentUser(req);
  if (!user) return fail("로그인이 필요해요.", 401);
  const before = Number(new URL(req.url).searchParams.get("before")) || 2_147_483_647;
  const rows = await db<{ id: number; date: string; content: string; mine: boolean }>(
    `select id, entry_date::text as date, content, (user_id = $1) as mine
       from entries where id < $2 order by id desc limit 30`,
    [user.id, before],
  );
  return json({ entries: rows, more: rows.length === 30 });
}
