import { db } from "@/lib/db";
import { createSession, deleteSession, fail, hashPin, json, verifyPin } from "@/lib/server";

// '이어하기'에서 고를 닉네임 목록 (작성 내용은 노출하지 않음)
export async function GET() {
  const rows = await db<{ nickname: string }>("select nickname from users order by nickname");
  return json({ nicknames: rows.map((r) => r.nickname) });
}

export async function POST(req: Request) {
  const { mode, nickname: rawName, pin, realName: rawReal } = await req.json().catch(() => ({}));
  const nickname = String(rawName ?? "").trim().replace(/\s+/g, " ");
  if (nickname.length < 1 || nickname.length > 12) return fail("닉네임은 1~12자로 정해주세요.");
  if (!/^\d{4}$/.test(String(pin ?? ""))) return fail("PIN은 숫자 4자리예요.");

  const [user] = await db<{ id: number; pin_hash: string; failed_count: number; locked_until: string | null }>(
    "select id, pin_hash, failed_count, locked_until from users where nickname = $1",
    [nickname],
  );

  if (mode === "new") {
    const realName = String(rawReal ?? "").trim().replace(/\s+/g, " ");
    if (realName.length < 1 || realName.length > 10) return fail("이름을 적어주세요. (관리자만 볼 수 있어요)");
    if (user) return fail("이미 있는 닉네임이에요. 다른 기기에서 쓰던 거라면 '이어하기'를 눌러주세요.", 409);
    const [created] = await db<{ id: number }>(
      "insert into users (nickname, pin_hash, real_name) values ($1, $2, $3) returning id",
      [nickname, hashPin(pin), realName],
    );
    return json({ token: await createSession(created.id), nickname });
  }

  if (!user) return fail("그런 닉네임이 없어요. 처음이라면 '처음 시작하기'를 눌러주세요.", 404);
  if (user.locked_until && new Date(user.locked_until) > new Date())
    return fail("PIN을 여러 번 틀려서 5분간 잠겼어요. 잠시 후 다시 해주세요.", 429);
  if (!verifyPin(pin, user.pin_hash)) {
    const failed = user.failed_count + 1;
    await db(
      "update users set failed_count = $2, locked_until = $3 where id = $1",
      [user.id, failed >= 5 ? 0 : failed, failed >= 5 ? new Date(Date.now() + 5 * 60_000).toISOString() : null],
    );
    return fail("PIN이 맞지 않아요. 기억나지 않으면 관리자에게 초기화를 부탁하세요.", 401);
  }
  await db("update users set failed_count = 0, locked_until = null where id = $1", [user.id]);
  return json({ token: await createSession(user.id), nickname });
}

export async function DELETE(req: Request) {
  await deleteSession(req);
  return json({ ok: true });
}
