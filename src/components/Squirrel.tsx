import type { FruitId } from "@/lib/rules";
import { Fruit } from "./Fruit";

// 열매 넣기 연출: 다람쥐가 깡총깡총 와서 풀밭의 내 열매를 집어 들고, 바구니에 던져 넣고 돌아간다.

function SquirrelBody() {
  return (
    <svg viewBox="0 0 120 120" aria-hidden>
      {/* 꼬리 */}
      <path d="M68 100 C 118 100 122 40 98 22 C 82 10 66 26 78 38 C 94 52 90 80 66 84 Z" fill="#c4834a" />
      <path d="M78 92 C 106 88 110 50 96 34 C 104 52 100 78 78 86 Z" fill="#dda06a" />
      {/* 몸 */}
      <ellipse cx="56" cy="86" rx="22" ry="24" fill="#b5713c" />
      <ellipse cx="50" cy="91" rx="12" ry="16" fill="#f1d7b0" />
      {/* 팔: 과일을 머리 위로 */}
      <path d="M46 74 L37 36" stroke="#9e5f30" strokeWidth="7" strokeLinecap="round" />
      <path d="M60 74 L57 34" stroke="#9e5f30" strokeWidth="7" strokeLinecap="round" />
      {/* 머리 */}
      <circle cx="46" cy="56" r="17" fill="#b5713c" />
      <path d="M47 42 L54 27 L60 45 Z" fill="#b5713c" />
      <path d="M50 41 L54 32 L57 43 Z" fill="#e7b48a" />
      <circle cx="32" cy="61" r="7" fill="#f1d7b0" />
      <circle cx="27" cy="59" r="2.6" fill="#3b2a1e" />
      <circle cx="40" cy="53" r="2.8" fill="#3b2a1e" />
      <circle cx="39" cy="52" r="1" fill="#fff" />
      <circle cx="44" cy="64" r="3" fill="#f2a097" opacity=".7" />
      {/* 발 */}
      <ellipse cx="45" cy="109" rx="9" ry="4" fill="#8a5428" />
      <ellipse cx="64" cy="109" rx="9" ry="4" fill="#8a5428" />
    </svg>
  );
}

export function SquirrelDrop({ fruit, golden }: { fruit: FruitId; golden: boolean }) {
  return (
    <>
      <div className="squirrel">
        <div className="squirrel-flip">
          <div className="held-fruit"><Fruit id={fruit} golden={golden} size="100%" /></div>
          <SquirrelBody />
        </div>
      </div>
      <div className="toss-fruit"><Fruit id={fruit} golden={golden} size="100%" /></div>
    </>
  );
}

/** 연출 전체 길이(ms). 이 시간이 지나면 바구니를 새로 불러온다. */
export const SQUIRREL_MS = 2900;
