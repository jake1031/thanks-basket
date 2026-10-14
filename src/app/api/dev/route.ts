import { db } from "@/lib/db";
import { WEEKDAYS, WEEKEND, basketOpen } from "@/lib/rules";
import { DEV, fail, hashPin, json, todayKST } from "@/lib/server";

// 개발 모드 전용: 날짜 미리보기에 맞춰 데모 팀원과 감사를 채운다.
const DEMO = [
  ["노래하는 다람쥐", 15, true], ["낮잠 자는 판다", 14, false], ["춤추는 고슴도치", 13, true],
  ["밥 먹는 펭귄", 12, false], ["산책하는 거북이", 11, true], ["기지개 켜는 고양이", 9, false],
  ["웃는 수달", 8, false], ["뜀뛰는 캥거루", 6, true], ["콧노래 부엉이", 5, false],
  ["꿀 먹은 곰돌이", 3, false], ["졸린 코알라", 2, false], ["수줍은 사슴", 0, false],
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
  const names = DEMO.map(([n]) => n);
  await db("delete from users where nickname = any($1)", [names]);
  if (action === "clear") return json({ ok: true });

  const today = todayKST(req);
  const pin = hashPin("0000");
  const ids: number[] = [];
  for (const [nickname] of DEMO) {
    const [{ id }] = await db<{ id: number }>("insert into users (nickname, pin_hash) values ($1, $2) returning id", [nickname, pin]);
    ids.push(id);
  }
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
      await db("insert into entries (user_id, entry_date, content) values ($1, $2, $3)", [ids[u], WEEKEND[0], "주말에 가족과 산책했어요 ✨"]);
    }
    if (basketOpen(today) && target !== 0) await db("insert into basket (user_id) values ($1)", [ids[u]]);
  }
  return json({ ok: true });
}
