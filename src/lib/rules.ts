// 이벤트 규칙 (서버/클라이언트 공용). 모든 날짜는 한국 시간(KST) 기준 'YYYY-MM-DD'.

export const WEEKDAYS = ["2026-10-19", "2026-10-20", "2026-10-21", "2026-10-22", "2026-10-23"];
export const WEEKEND = ["2026-10-24"]; // 토요일만 보너스 감사 (일요일은 결산·읽기 전용)
export const EVENT_DAYS = [...WEEKDAYS, ...WEEKEND];
export const PER_DAY = 3;
export const MAX_COUNT = WEEKDAYS.length * PER_DAY; // 15
export const TEAM_SIZE = 25;
export const MAX_LEN = 200;
export const COMMENT_LEN = 100;

export type FruitId = "chestnut" | "tangerine" | "persimmon" | "pear" | "apple";

export const FRUITS: { id: FruitId; name: string; min: number; max: number }[] = [
  { id: "chestnut", name: "밤", min: 0, max: 3 },
  { id: "tangerine", name: "귤", min: 4, max: 6 },
  { id: "persimmon", name: "감", min: 7, max: 9 },
  { id: "pear", name: "배", min: 10, max: 12 },
  { id: "apple", name: "사과", min: 13, max: 15 },
];

export function fruitFor(count: number) {
  return FRUITS.find((f) => count >= f.min && count <= f.max) ?? FRUITS[0];
}

/** 받침 유무에 따라 조사 선택: josa("감", "으로", "로") → "감으로" */
export function josa(word: string, withFinal: string, without: string) {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  const hasFinal = code >= 0 && code <= 11171 && code % 28 !== 0;
  return word + (hasFinal ? withFinal : without);
}

export function nextFruit(count: number) {
  return FRUITS.find((f) => f.min > count) ?? null;
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
