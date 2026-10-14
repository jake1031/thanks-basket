import { db } from "@/lib/db";
import { WEEKDAYS, WEEKEND, basketOpen } from "@/lib/rules";
import { DEV, currentUser, fail, hashPin, json, todayKST } from "@/lib/server";

// 개발 모드 전용: 날짜 미리보기에 맞춰 데모 팀원과 감사를 채운다.
const DEMO = [
  ["노래하는 다람쥐", 15, true], ["낮잠 자는 판다", 15, false], ["춤추는 고슴도치", 14, true],
  ["밥 먹는 펭귄", 13, false], ["산책하는 거북이", 13, false], ["기지개 켜는 고양이", 12, true],
  ["웃는 수달", 12, false], ["뜀뛰는 캥거루", 11, false], ["콧노래 부엉이", 10, true],
  ["꿀 먹은 곰돌이", 10, false], ["졸린 코알라", 9, false], ["수줍은 사슴", 9, true],
  ["박수 치는 물개", 8, false], ["뒹구는 너구리", 7, false], ["깡충 토끼", 6, true],
  ["하품하는 강아지", 6, false], ["구르는 햄스터", 5, false], ["손 흔드는 오리", 4, false],
  ["느긋한 나무늘보", 3, true], ["바쁜 꿀벌", 2, false], ["엉뚱한 여우", 1, false],
  ["노래 연습 중인 참새", 13, true], ["반짝이는 반딧불", 11, false], ["수다쟁이 앵무새", 0, false],
] as const;

const SAMPLES = [
  "아침에 따뜻한 커피 한 잔을 마실 수 있어서 감사해요",
  "연습 때 화음이 딱 맞아서 너무 행복했어요",
  "가족이 모두 건강해서 감사합니다",
  "출근길 하늘이 너무 예뻤어요",
  "오랜만에 친구한테 연락이 와서 반가웠어요",
  "맛있는 점심을 먹었어요 🍚",
  "힘든 하루였지만 잘 버틴 나에게 감사",
  "찬양 가사가 오늘 마음에 크게 와닿았어요",
  "비가 그쳐서 우산 없이 집에 왔어요",
  "동료가 커피를 사줬어요 ☕",
  "푹 잘 수 있어서 감사해요",
  "부모님과 통화하며 웃을 수 있었어요",
  "단풍이 물들기 시작한 길을 걸었어요 🍁",
  "작은 실수를 너그럽게 넘어가 준 분께 감사",
  "싱어팀 단톡방이 오늘도 따뜻했어요",
];

export async function POST(req: Request) {
  if (!DEV) return fail("Not found", 404);
  const { action } = await req.json().catch(() => ({}));
  if (action === "unplace") {
    // 내 열매를 바구니에서 다시 꺼내기 (넣는 모습 다시 보기용)
    const user = await currentUser(req);
    if (user) await db("delete from basket where user_id = $1", [user.id]);
    return json({ ok: true });
  }
  const names = DEMO.map(([n]) => n);
  if (action === "clear") {
    await db("delete from users where nickname = any($1)", [names]);
    return json({ ok: true });
  }

  // 데모 계정은 지우지 않고 유지한다 (데모 계정으로 로그인한 상태가 풀리지 않도록).
  // 그 계정들의 감사·바구니 기록만 지우고 미리보기 날짜에 맞게 다시 채운다.
  const today = todayKST(req);
  const pin = hashPin("0000");
  const ids: number[] = [];
  for (const [nickname] of DEMO) {
    const [{ id }] = await db<{ id: number }>(
      `insert into users (nickname, pin_hash) values ($1, $2)
       on conflict (nickname) do update set nickname = excluded.nickname returning id`,
      [nickname, pin],
    );
    ids.push(id);
  }
  await db("delete from entries where user_id = any($1)", [ids]);
  await db("delete from basket where user_id = any($1)", [ids]);
  // 날짜 순서대로 섞여 쌓이도록 날짜 → 사람 순으로 넣는다
  let k = 0;
  const left = DEMO.map(([, target]) => target as number);
  for (const d of WEEKDAYS) {
    if (d > today) break;
    for (let u = 0; u < DEMO.length; u++) {
      const n = Math.min(3, left[u]);
      for (let i = 0; i < n; i++) {
        await db("insert into entries (user_id, entry_date, content) values ($1, $2, $3)", [ids[u], d, SAMPLES[k++ % SAMPLES.length]]);
      }
      left[u] -= n;
    }
  }
  for (let u = 0; u < DEMO.length; u++) {
    const [, target, golden] = DEMO[u];
    if (golden && WEEKEND[0] <= today) {
      await db("insert into entries (user_id, entry_date, content) values ($1, $2, $3)", [ids[u], WEEKEND[0], "토요일 아침 가족과 산책했어요 ✨"]);
    }
    if (basketOpen(today) && target !== 0) await db("insert into basket (user_id) values ($1)", [ids[u]]);
  }
  return json({ ok: true });
}
