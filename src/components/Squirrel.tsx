"use client";

import { useLayoutEffect, useRef, type RefObject } from "react";
import type { FruitId } from "@/lib/rules";
import { Fruit } from "./Fruit";

// 열매 넣기 연출: 다람쥐가 숲 저 멀리서 달려와 카드 속 내 열매를 입에 물고,
// 바구니로 달려가 테두리 위에서 떨어뜨려 넣은 뒤 숲으로 사라진다.
// 화면 위치를 실제로 재서 움직이므로 기기 크기가 달라도 경로가 맞는다.

/** 옆에서 본 달리는 다람쥐 (왼쪽을 바라봄) */
function SquirrelSide() {
  return (
    <svg viewBox="0 0 100 70" aria-hidden>
      <path d="M60 42 C 96 46 104 6 82 2 C 68 -1 64 14 75 18 C 88 23 84 38 64 35 Z" fill="#c4834a" />
      <path d="M70 38 C 92 36 96 12 84 6 C 90 16 88 32 70 34 Z" fill="#dda06a" />
      <ellipse cx="58" cy="57" rx="8" ry="5" fill="#8a5428" />
      <ellipse cx="44" cy="45" rx="22" ry="14" fill="#b5713c" />
      <ellipse cx="40" cy="50" rx="14" ry="8" fill="#f1d7b0" />
      <ellipse cx="27" cy="58" rx="5.5" ry="4" fill="#8a5428" />
      <circle cx="22" cy="34" r="12.5" fill="#b5713c" />
      <path d="M24 24 L28 12 L33 26 Z" fill="#b5713c" />
      <path d="M26 23 L28 16 L31 25 Z" fill="#e7b48a" />
      <ellipse cx="13" cy="38" rx="6.5" ry="5" fill="#f1d7b0" />
      <circle cx="8.5" cy="36.5" r="2.2" fill="#3b2a1e" />
      <circle cx="19" cy="31" r="2.4" fill="#3b2a1e" />
      <circle cx="18.3" cy="30.3" r=".8" fill="#fff" />
    </svg>
  );
}

export const SQUIRREL_MS = 3600;
/** 과일이 바구니에 닿는 시점 (전체 대비) */
export const DROP_AT = 0.8;

type Pt = { x: number; y: number };

export function SquirrelRun({ fruit, golden, areaRef, stageRef, fromRef }: {
  fruit: FruitId; golden: boolean;
  areaRef: RefObject<HTMLDivElement | null>;   // 좌표 기준 (숲 화면)
  stageRef: RefObject<HTMLDivElement | null>;  // 바구니
  fromRef: RefObject<HTMLDivElement | null>;   // 카드 속 내 열매
}) {
  const sqRef = useRef<HTMLDivElement>(null);
  const faceRef = useRef<HTMLDivElement>(null);
  const mouthRef = useRef<HTMLDivElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const area = areaRef.current, stage = stageRef.current, from = fromRef.current;
    const sq = sqRef.current, face = faceRef.current, mouth = mouthRef.current, drop = dropRef.current;
    if (!area || !stage || !from || !sq || !face || !mouth || !drop) return;

    const a = area.getBoundingClientRect();
    const s = stage.getBoundingClientRect();
    const f = from.getBoundingClientRect();
    const rel = (x: number, y: number): Pt => ({ x: x - a.left, y: y - a.top });

    const far = rel(a.right + 40, s.top + s.height * 0.15);              // 숲 저 멀리 (오른쪽)
    const atFruit = rel(f.right + 22, f.top + f.height * 0.45);           // 카드 열매 오른쪽 옆
    const atRim = rel(s.left + s.width * 0.8, s.top + s.height * 0.5);    // 바구니 오른쪽 테두리 위
    const away = rel(a.left - 60, s.top + s.height * 0.1);                // 숲 속으로 (왼쪽)

    const W = 76; // 다람쥐 크기(px)
    const at = (p: Pt, scale: number, extra = "") =>
      `translate(${p.x - W / 2}px, ${p.y - W * 0.7}px) scale(${scale}) ${extra}`;
    const T = SQUIRREL_MS;
    const ease = "cubic-bezier(.45, 0, .55, 1)";

    const anims = [
      // 이동 경로: 멀리서(작게) → 카드 열매 → 바구니 테두리 → 숲 속으로
      sq.animate(
        [
          { offset: 0, transform: at(far, 0.45), opacity: 0 },
          { offset: 0.06, opacity: 1 },
          { offset: 0.3, transform: at(atFruit, 1) },
          { offset: 0.42, transform: at(atFruit, 1) },
          { offset: 0.42, transform: at(atFruit, 1) },
          { offset: 0.68, transform: at(atRim, 0.8) },
          { offset: 0.84, transform: at(atRim, 0.8) },
          { offset: 0.96, opacity: 1 },
          { offset: 1, transform: at(away, 0.5), opacity: 0 },
        ],
        { duration: T, easing: ease, fill: "both" },
      ),
      // 바라보는 방향: 왼쪽 → (열매 물고) 오른쪽 → 왼쪽
      face.animate(
        [
          { offset: 0, transform: "scaleX(1)" },
          { offset: 0.42, transform: "scaleX(1)" },
          { offset: 0.42, transform: "scaleX(-1)" },
          { offset: 0.84, transform: "scaleX(-1)" },
          { offset: 0.84, transform: "scaleX(1)" },
          { offset: 1, transform: "scaleX(1)" },
        ],
        { duration: T, fill: "both" },
      ),
      // 입에 문 열매: 집는 순간 나타나고 떨어뜨리는 순간 사라짐
      mouth.animate(
        [
          { offset: 0, opacity: 0 }, { offset: 0.36, opacity: 0 }, { offset: 0.36, opacity: 1 },
          { offset: DROP_AT - 0.06, opacity: 1 }, { offset: DROP_AT - 0.06, opacity: 0 }, { offset: 1, opacity: 0 },
        ],
        { duration: T, fill: "both" },
      ),
      // 카드 속 열매: 다람쥐가 무는 순간 사라짐
      from.animate(
        [{ offset: 0, opacity: 1 }, { offset: 0.36, opacity: 1 }, { offset: 0.36, opacity: 0 }, { offset: 1, opacity: 0 }],
        { duration: T, fill: "both" },
      ),
    ];

    // 바구니로 떨어지는 열매 (테두리 뒤로 쏙)
    const dropFrom = rel(s.left + s.width * 0.72, s.top + s.height * 0.42);
    const dropTo = rel(s.left + s.width * 0.5, s.top + s.height * 0.55);
    const D = 44;
    const p = (pt: Pt, r: number) => `translate(${pt.x - D / 2}px, ${pt.y - D / 2}px) rotate(${r}deg)`;
    const peak = { x: (dropFrom.x + dropTo.x) / 2, y: Math.min(dropFrom.y, dropTo.y) - s.height * 0.22 };
    anims.push(
      drop.animate(
        [
          { offset: 0, transform: p(dropFrom, 0), opacity: 0 },
          { offset: DROP_AT - 0.06, transform: p(dropFrom, 0), opacity: 0 },
          { offset: DROP_AT - 0.06, transform: p(dropFrom, 0), opacity: 1 },
          { offset: DROP_AT, transform: p(peak, -120), opacity: 1 },
          { offset: DROP_AT + 0.08, transform: p(dropTo, -240), opacity: 1 },
          { offset: DROP_AT + 0.11, transform: p(dropTo, -260), opacity: 0 },
          { offset: 1, transform: p(dropTo, -260), opacity: 0 },
        ],
        { duration: T, easing: "linear", fill: "both" },
      ),
    );

    return () => anims.forEach((x) => x.cancel());
  }, [areaRef, stageRef, fromRef]);

  return (
    <>
      <div className="drop-fruit" ref={dropRef}><Fruit id={fruit} golden={golden} size="100%" /></div>
      <div className="runner" ref={sqRef}>
        <div className="runner-face" ref={faceRef}>
          <div className="runner-hop">
            <div className="mouth-fruit" ref={mouthRef}><Fruit id={fruit} golden={golden} size="100%" /></div>
            <SquirrelSide />
          </div>
        </div>
      </div>
    </>
  );
}
