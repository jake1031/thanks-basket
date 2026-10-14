import { db } from "@/lib/db";
import { MAX_LEN, canEditDate } from "@/lib/rules";
import { currentUser, fail, json, todayKST } from "@/lib/server";

type Ctx = { params: Promise<{ id: string }> };

async function ownEntry(req: Request, ctx: Ctx) {
  const user = await currentUser(req);
  if (!user) return { error: fail("로그인이 필요해요.", 401) };
  const { id } = await ctx.params;
  const [entry] = await db<{ id: number; date: string }>(
    "select id, entry_date::text as date from entries where id = $1 and user_id = $2",
    [Number(id), user.id],
  );
  if (!entry) return { error: fail("감사를 찾을 수 없어요.", 404) };
  if (!canEditDate(todayKST(), entry.date)) return { error: fail("지금은 이 날짜의 감사를 고칠 수 없어요.", 403) };
  return { entry };
}

export async function PATCH(req: Request, ctx: Ctx) {
  const { entry, error } = await ownEntry(req, ctx);
  if (error) return error;
  const { content: raw } = await req.json().catch(() => ({}));
  const content = String(raw ?? "").trim();
  if (!content) return fail("감사 내용을 적어주세요.");
  if (content.length > MAX_LEN) return fail(`${MAX_LEN}자까지 쓸 수 있어요.`);
  const [updated] = await db(
    "update entries set content = $2, updated_at = now() where id = $1 returning id, entry_date::text as date, content",
    [entry.id, content],
  );
  return json({ entry: updated });
}

export async function DELETE(req: Request, ctx: Ctx) {
  const { entry, error } = await ownEntry(req, ctx);
  if (error) return error;
  await db("delete from entries where id = $1", [entry.id]);
  return json({ ok: true });
}
