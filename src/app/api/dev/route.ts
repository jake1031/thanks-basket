import { db } from "@/lib/db";
import { WEEKDAYS, WEEKEND, basketOpen, unlockedFruits } from "@/lib/rules";
import { userStats } from "@/lib/stats";
import { DEV, currentUser, fail, hashPin, json, todayKST } from "@/lib/server";

// 개발 모드 전용: 날짜 미리보기에 맞춰 데모 팀원과 감사를 채운다.
const DEMO = [
  ["노래하는 다람쥐", 15, true], ["낮잠 자는 판다", 15, true], ["춤추는 고슴도치", 14, true],
  ["밥 먹는 펭귄", 13, true], ["산책하는 거북이", 13, false], ["기지개 켜는 고양이", 12, true],
  ["웃는 수달", 12, true], ["뜀뛰는 캥거루", 11, false], ["콧노래 부엉이", 10, true],
  ["꿀 먹은 곰돌이", 10, true], ["졸린 코알라", 9, false], ["수줍은 사슴", 9, true],
  ["박수 치는 물개", 8, false], ["뒹구는 너구리", 7, false], ["깡충 토끼", 6, true],
  ["하품하는 강아지", 6, false], ["구르는 햄스터", 5, false], ["손 흔드는 오리", 4, false],
  ["느긋한 나무늘보", 3, true], ["바쁜 꿀벌", 2, false], ["엉뚱한 여우", 1, false],
  ["노래 연습 중인 참새", 13, true], ["반짝이는 반딧불", 11, false], ["수다쟁이 앵무새", 0, false],
] as const;

const DEMO_NAMES = [
  "김지은", "이서준", "박하은", "최민준", "정수아", "강도윤", "조예린", "윤시우",
  "장서연", "임주원", "한지호", "오채원", "서하준", "신유나", "권지안", "황민서",
  "안예준", "송다은", "류건우", "홍서윤", "전태민", "고은비", "문승현", "양소율",
];

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
  "버스를 딱 맞춰 탔어요 🚌",
  "기도 제목이 하나 응답됐어요 🙏",
  "퇴근길에 노을이 너무 예뻤어요",
  "아이가 먼저 안아줬어요",
  "목 상태가 좋아져서 마음껏 노래했어요",
  "오늘 하루도 무사히 지나가서 감사해요",
  "점심에 먹은 김치찌개가 정말 맛있었어요",
  "회의가 생각보다 빨리 끝났어요",
  "길에서 귀여운 강아지를 만났어요 🐶",
  "따뜻한 물로 샤워할 수 있어서 감사",
  "말씀 묵상 중에 위로를 받았어요",
  "엄마가 반찬을 보내주셨어요",
  "운동을 빼먹지 않고 다녀왔어요",
  "새로 배운 곡이 점점 익숙해지고 있어요",
  "친구의 고민을 들어줄 수 있었어요",
  "가을 바람이 시원해서 기분이 좋았어요",
  "밀린 일을 드디어 끝냈어요",
  "저녁에 가족이랑 다 같이 밥을 먹었어요",
  "누군가 엘리베이터를 잡아줬어요",
  "좋아하는 노래가 라디오에서 나왔어요 📻",
  "아픈 데 없이 하루를 보냈어요",
  "팀원이 응원 메시지를 보내줬어요",
  "책 한 챕터를 다 읽었어요 📖",
  "따뜻한 붕어빵을 사 먹었어요",
  "예배 때 마음이 평안했어요",
  "오랜만에 방 정리를 했어요",
  "고구마가 정말 달았어요 🍠",
  "아침에 눈뜰 수 있는 것 자체가 감사",
  "동생이랑 오랜만에 수다를 떨었어요",
  "어려운 부분 화음을 드디어 외웠어요",
];

const SATURDAY = [
  "토요일 아침 가족과 산책했어요 ✨",
  "늦잠을 푹 자서 개운했어요",
  "주말 연습에 다 같이 모여서 좋았어요",
  "내일 추수감사 예배가 기대돼요",
  "한 주 동안 감사를 적으면서 마음이 따뜻해졌어요",
  "친구랑 브런치를 먹었어요 🥞",
];

// 같은 입력이면 항상 같은 값이 나오는 간단한 난수
function rand(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

/** 목표 개수를 평일 5일에 골고루(하루 최대 3) 흩어 놓는다 */
function spread(target: number, seed: number) {
  const days = [0, 0, 0, 0, 0];
  let left = target;
  let t = 0;
  while (left > 0) {
    const d = Math.floor(rand(seed * 31 + t++) * 5);
    if (days[d] < 3) { days[d]++; left--; }
  }
  return days;
}


export async function POST(req: Request) {
  if (!DEV) return fail("Not found", 404);
  const { action, n } = await req.json().catch(() => ({}));
  if (action === "basket") {
    // 바구니에 넣은 사람 수를 n명으로 맞춰 보기 (데모 팀원 기준, 넣은 순서 유지)
    const keep = await db<{ user_id: number }>("select user_id from basket order by placed_at limit $1", [Number(n) || 0]);
    await db("delete from basket where not (user_id = any($1))", [keep.map((k) => k.user_id)]);
    if (keep.length < Number(n)) {
      const more = await db<{ id: number }>(
        `select u.id from users u where not exists (select 1 from basket b where b.user_id = u.id)
          and exists (select 1 from entries e where e.user_id = u.id) order by u.id limit $1`,
        [Number(n) - keep.length],
      );
      for (const m of more) {
        const [st] = await userStats(m.id);
        const open = unlockedFruits(st.count);
        await db("insert into basket (user_id, fruit) values ($1, $2)", [m.id, open[(m.id * 7) % open.length]]);
      }
    }
    return json({ ok: true });
  }
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
  for (const [i, [nickname]] of DEMO.entries()) {
    const [{ id }] = await db<{ id: number }>(
      `insert into users (nickname, pin_hash, real_name) values ($1, $2, $3)
       on conflict (nickname) do update set real_name = excluded.real_name returning id`,
      [nickname, pin, DEMO_NAMES[i % DEMO_NAMES.length]],
    );
    ids.push(id);
  }
  await db("delete from entries where user_id = any($1)", [ids]);
  await db("delete from basket where user_id = any($1)", [ids]);
  await db("delete from comments where target_user_id = any($1) or author_id = any($1)", [ids]);
  // 날짜 → 사람 순으로 넣어 게시판에서 자연스럽게 섞이게 한다
  const plans = DEMO.map(([, target], u) => spread(target as number, u + 1));
  let k = 0;
  for (let di = 0; di < WEEKDAYS.length; di++) {
    const d = WEEKDAYS[di];
    if (d > today) break;
    for (let u = 0; u < DEMO.length; u++) {
      for (let i = 0; i < plans[u][di]; i++) {
        k += 7; // 같은 사람이 같은 문장을 반복하지 않도록 건너뛰며 고른다
        await db("insert into entries (user_id, entry_date, content) values ($1, $2, $3)", [ids[u], d, SAMPLES[(k + u) % SAMPLES.length]]);
      }
    }
  }
  for (let u = 0; u < DEMO.length; u++) {
    const [, target, golden] = DEMO[u];
    if (golden && WEEKEND[0] <= today) {
      const n = 1 + Math.floor(rand(u + 100) * 3);
      for (let i = 0; i < n; i++) {
        await db("insert into entries (user_id, entry_date, content) values ($1, $2, $3)", [ids[u], WEEKEND[0], SATURDAY[(u + i) % SATURDAY.length]]);
      }
    }
    if (basketOpen(today) && target !== 0) {
      // 데모 팀원은 해금된 열매 중 하나를 골라 넣는다 (높은 단계 쪽을 더 자주)
      const open = unlockedFruits(target as number);
      const pick = open[Math.max(0, open.length - 1 - Math.floor(rand(u + 300) * Math.min(6, open.length)))];
      await db("insert into basket (user_id, fruit) values ($1, $2)", [ids[u], pick]);
    }
  }
  return json({ ok: true });
}
