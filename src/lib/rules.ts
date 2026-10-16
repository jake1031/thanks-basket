// 이벤트 규칙 (서버/클라이언트 공용). 모든 날짜는 한국 시간(KST) 기준 'YYYY-MM-DD'.

export const WEEKDAYS = ["2026-10-19", "2026-10-20", "2026-10-21", "2026-10-22", "2026-10-23"];
export const WEEKEND = ["2026-10-24"]; // 토요일만 보너스 감사 (일요일은 결산·읽기 전용)
export const EVENT_DAYS = [...WEEKDAYS, ...WEEKEND];
export const PER_DAY = 3;
export const MAX_COUNT = WEEKDAYS.length * PER_DAY; // 15
export const TEAM_SIZE = 25;
export const MAX_LEN = 200;
export const COMMENT_LEN = 100;

export type FruitId =
  | "chestnut" | "tangerine" | "persimmon"
  | "fig" | "lemon"
  | "apple" | "pomegranate"
  | "mango"
  | "watermelon";

/** 크기별 5단계 (1단계 3종, 2·3단계 2종, 4·5단계 1종). 평일 감사 개수로 단계가 올라가고, 내 단계까지의 열매가 모두 해금된다. */
export const TIERS: { level: number; name: string; min: number; max: number; fruits: FruitId[] }[] = [
  { level: 1, name: "한입 열매", min: 0, max: 3, fruits: ["chestnut", "tangerine", "persimmon"] },
  { level: 2, name: "손바닥 열매", min: 4, max: 6, fruits: ["fig", "lemon"] },
  { level: 3, name: "주먹 열매", min: 7, max: 9, fruits: ["apple", "pomegranate"] },
  { level: 4, name: "두손 열매", min: 10, max: 12, fruits: ["mango"] },
  { level: 5, name: "아름드리 열매", min: 13, max: 15, fruits: ["watermelon"] },
];

export const FRUIT_NAMES: Record<FruitId, string> = {
  chestnut: "밤", tangerine: "귤", persimmon: "감",
  fig: "무화과", lemon: "레몬",
  apple: "사과", pomegranate: "석류",
  mango: "망고",
  watermelon: "수박",
};

export const ALL_FRUITS: FruitId[] = TIERS.flatMap((t) => t.fruits);

export function tierFor(count: number) {
  return TIERS.find((t) => count >= t.min && count <= t.max) ?? TIERS[0];
}
export function nextTier(count: number) {
  return TIERS.find((t) => t.min > count) ?? null;
}
export function tierOf(fruit: FruitId) {
  return TIERS.find((t) => t.fruits.includes(fruit)) ?? TIERS[0];
}
/** 평일 감사 개수로 해금된 열매 */
export function unlockedFruits(count: number): FruitId[] {
  return TIERS.filter((t) => t.min <= count).flatMap((t) => t.fruits);
}
export function isFruitId(x: unknown): x is FruitId {
  return typeof x === "string" && (ALL_FRUITS as string[]).includes(x);
}

/** 받침 유무에 따라 조사 선택: josa("감", "으로", "로") → "감으로" */
export function josa(word: string, withFinal: string, without: string) {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  const hasFinal = code >= 0 && code <= 11171 && code % 28 !== 0;
  return word + (hasFinal ? withFinal : without);
}


const DOW = ["일", "월", "화", "수", "목", "금", "토"];
export function dayLabel(date: string) {
  const [, m, d] = date.split("-").map(Number);
  const dow = new Date(date + "T00:00:00Z").getUTCDay();
  return { md: `${m}/${d}`, dow: DOW[dow] };
}

export type Phase =
  | "before" // 10/19 이전: 가입만 가능
  | "weekday" // 평일: 오늘까지의 평일 칸 작성/수정/삭제 가능
  | "weekend" // 토요일: 평일 기록 잠금, 보너스 감사만, 바구니 넣기 가능
  | "after"; // 일요일(10/25)부터: 감사는 읽기 전용, 바구니 넣기는 가능

export function phaseOf(today: string): Phase {
  if (today < WEEKDAYS[0]) return "before";
  if (WEEKDAYS.includes(today)) return "weekday";
  if (WEEKEND.includes(today)) return "weekend";
  return "after";
}

/** 해당 날짜의 감사를 지금 쓰거나 고칠 수 있는지 */
export function canEditDate(today: string, date: string) {
  const phase = phaseOf(today);
  if (phase === "weekday") return WEEKDAYS.includes(date) && date <= today;
  if (phase === "weekend") return date === today;
  return false;
}

export const basketOpen = (today: string) => phaseOf(today) === "weekend" || phaseOf(today) === "after";
