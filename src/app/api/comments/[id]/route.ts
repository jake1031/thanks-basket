import { db } from "@/lib/db";
import { currentUser, fail, json } from "@/lib/server";

type Ctx = { params: Promise<{ id: string }> };

// 내가 쓴 댓글만 지울 수 있다
export async function DELETE(req: Request, ctx: Ctx) {
  const user = await currentUser(req);
  if (!user) return fail("로그인이 필요해요.", 401);
  const { id } = await ctx.params;
  const rows = await db("delete from comments where id = $1 and author_id = $2 returning id", [Number(id), user.id]);
  if (!rows.length) return fail("댓글을 찾을 수 없어요.", 404);
  return json({ ok: true });
}
