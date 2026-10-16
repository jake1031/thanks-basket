"use client";

import { useLayoutEffect, useRef, type RefObject } from "react";
import type { FruitId } from "@/lib/rules";
import { Fruit } from "./Fruit";

// 열매 넣기 연출 (약 7.4초)
//  1. 숲 저 멀리서 다람쥐가 통통 뛰어온다 (발이 번갈아 움직임)
//  2. 카드 속 내 열매 앞에 멈춰, 몸을 숙이고 두 손으로 집어 가슴에 안는다
//  3. 열매를 안고 천천히 바구니로 달려간다
//  4. 바구니 테두리 위에서 몸을 숙여 열매를 바구니 안에 쏙 넣는다
//  5. 돌아서 숲으로 달려가 사라진다
// 화면 위치를 실제로 재서 움직이므로 기기 크기가 달라도 경로가 맞는다.

/** 옆에서 본 두 발로 선 다람쥐 (왼쪽을 바라봄). 다리·팔·꼬리·몸은 상태(data-state)에 따라 CSS로 움직인다. */
function SquirrelFigure({ fruit, golden }: { fruit: FruitId; golden: boolean }) {
  return (
    <svg viewBox="0 0 100 124" aria-hidden>
      {/* 꼬리 */}
      <g className="sq-tail">
        <path d="M58 98 C 96 98 104 46 90 22 C 80 6 62 12 66 26 C 70 38 84 42 82 62 C 80 80 66 84 56 86 Z" fill="#c4834a" />
        <path d="M66 92 C 90 88 96 52 86 30 C 90 50 86 76 64 84 Z" fill="#dda06a" />
      </g>
      {/* 먼 쪽 다리·팔 (어둡게) */}
      <g className="sq-leg sq-leg-far">
        <path d="M50 94 Q 50 106 47 113" stroke="#8a5428" strokeWidth="9" strokeLinecap="round" fill="none" />
        <ellipse cx="42" cy="115" rx="9" ry="4.2" fill="#7a4a22" />
      </g>
      <g className="sq-body">
        <g className="sq-arm sq-arm-far">
          <path d="M42 66 L40 82" stroke="#8a5428" strokeWidth="6" strokeLinecap="round" />
        </g>
        {/* 몸 */}
        <ellipse cx="50" cy="78" rx="18" ry="23" fill="#b5713c" transform="rotate(-8 50 78)" />
        <ellipse cx="43" cy="82" rx="10" ry="16" fill="#f1d7b0" transform="rotate(-8 43 82)" />
        {/* 머리 */}
        <circle cx="40" cy="45" r="15.5" fill="#b5713c" />
        <path d="M43 33 L49 17 L56 35 Z" fill="#b5713c" />
        <path d="M46 31 L49 22 L53 33 Z" fill="#e7b48a" />
        <ellipse cx="27" cy="50" rx="8.5" ry="6.5" fill="#f1d7b0" />
        <circle cx="20" cy="48" r="2.7" fill="#3b2a1e" />
        <circle cx="35" cy="42" r="2.8" fill="#3b2a1e" />
        <circle cx="34.2" cy="41.2" r="1" fill="#fff" />
        <circle cx="36" cy="53" r="3" fill="#f2a097" opacity=".6" />
        {/* 두 손으로 안은 열매 */}
        <g className="sq-held" transform="translate(9 58)">
          <Fruit id={fruit} golden={golden} size={30} />
        </g>
        <g className="sq-arm sq-arm-near">
          <path d="M42 66 L40 82" stroke="#9e5f30" strokeWidth="6.5" strokeLinecap="round" />
        </g>
      </g>
      {/* 가까운 쪽 다리 */}
      <g className="sq-leg sq-leg-near">
        <path d="M54 94 Q 54 106 51 113" stroke="#9e6232" strokeWidth="10" strokeLinecap="round" fill="none" />
        <ellipse cx="46" cy="116" rx="9.5" ry="4.5" fill="#8a5428" />
      </g>
    </svg>
  );
}

export const SQUIRREL_MS = 7400;
/** 열매가 바구니에 들어가는 시점 (전체 대비) */
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
  const dropRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const area = areaRef.current, stage = stageRef.current, from = fromRef.current;
    const sq = sqRef.current, face = faceRef.current, drop = dropRef.current;
    if (!area || !stage || !from || !sq || !face || !drop) return;

    const a = area.getBoundingClientRect();
    const s = stage.getBoundingClientRect();
    const f = from.getBoundingClientRect();
    const rel = (x: number, y: number): Pt => ({ x: x - a.left, y: y - a.top });
    const T = SQUIRREL_MS;
    const W = 92; // 다람쥐 크기(px)

    // 발 위치 기준 좌표
    const far = rel(a.right + 50, s.top + s.height * 0.32);           // 숲 저 멀리 (오른쪽)
    const atFruit = rel(f.right + 28, f.bottom + 2);                   // 카드 열매 오른쪽 옆
    const atRim = rel(s.left + s.width * 0.82, s.top + s.height * 0.6); // 바구니 오른쪽 테두리 위
    const away = rel(a.left - 70, s.top + s.height * 0.3);             // 숲 속으로 (왼쪽)
    const at = (p: Pt, scale: number) => `translate(${p.x - W / 2}px, ${p.y - W * 1.2}px) scale(${scale})`;
    const io = "ease-in-out";

    // 시간표 (전체 대비)
    const t = {
      arrive: 0.27,   // 열매 앞 도착
      reach: 0.33,    // 몸 숙여 손 뻗기
      grab: 0.37,     // 열매 집기
      lift: 0.42,     // 안고 일어서기
      atRim: 0.68,    // 바구니 도착
      lean: 0.73,     // 바구니로 몸 숙이기
      release: DROP_AT - 0.04, // 손 놓기
      turn: 0.85,     // 돌아서기
    };

    const anims: Animation[] = [
      sq.animate(
        [
          { offset: 0, transform: at(far, 0.45), opacity: 0, easing: io },
          { offset: 0.05, transform: at(far, 0.5), opacity: 1, easing: io },
          { offset: t.arrive, transform: at(atFruit, 1), easing: "linear" },
          { offset: t.lift, transform: at(atFruit, 1), easing: io },
          { offset: t.atRim, transform: at(atRim, 0.82), easing: "linear" },
          { offset: t.turn, transform: at(atRim, 0.82), easing: "ease-in" },
          { offset: 0.97, opacity: 1 },
          { offset: 1, transform: at(away, 0.45), opacity: 0 },
        ],
        { duration: T, fill: "both" },
      ),
      // 바라보는 방향: 왼쪽(열매 쪽) → 오른쪽(바구니 쪽) → 왼쪽(숲 쪽)
      face.animate(
        [
          { offset: 0, transform: "scaleX(1)" },
          { offset: t.lift, transform: "scaleX(1)" },
          { offset: t.lift, transform: "scaleX(-1)" },
          { offset: t.turn, transform: "scaleX(-1)" },
          { offset: t.turn, transform: "scaleX(1)" },
          { offset: 1, transform: "scaleX(1)" },
        ],
        { duration: T, fill: "both" },
      ),
      // 카드 속 열매: 다람쥐가 손으로 집는 순간 사라짐
      from.animate(
        [{ offset: 0, opacity: 1 }, { offset: t.grab, opacity: 1 }, { offset: t.grab, opacity: 0 }, { offset: 1, opacity: 0 }],
        { duration: T, fill: "both" },
      ),
    ];

    // 바구니 안으로 쏙 들어가는 열매 (테두리 뒤로)
    const D = 40;
    const dropFrom = rel(s.left + s.width * 0.7, s.top + s.height * 0.36);
    const dropTo = rel(s.left + s.width * 0.56, s.top + s.height * 0.58);
    const p = (pt: Pt, r: number) => `translate(${pt.x - D / 2}px, ${pt.y - D / 2}px) rotate(${r}deg)`;
    anims.push(
      drop.animate(
        [
          { offset: 0, transform: p(dropFrom, 0), opacity: 0 },
          { offset: t.release, transform: p(dropFrom, 0), opacity: 0 },
          { offset: t.release, transform: p(dropFrom, 0), opacity: 1, easing: "ease-in" },
          { offset: t.release + 0.07, transform: p(dropTo, -50), opacity: 1 },
          { offset: t.release + 0.1, transform: p(dropTo, -60), opacity: 0 },
          { offset: 1, transform: p(dropTo, -60), opacity: 0 },
        ],
        { duration: T, fill: "both" },
      ),
    );

    // 동작 상태 바꾸기: 달리기 / 서기 / 숙여 집기 / 안고 달리기 / 숙여 넣기
    const states: [number, string][] = [
      [0, "run"], [t.arrive, "stand"], [t.reach, "reach"], [t.grab, "reach hold"], [t.lift, "carry"],
      [t.atRim, "stand hold"], [t.lean, "lean hold"], [t.release, "lean"], [t.turn, "run"],
    ];
    const timers = states.map(([at, st]) => setTimeout(() => { sq.dataset.state = st; }, at * T));

    return () => { anims.forEach((x) => x.cancel()); timers.forEach(clearTimeout); };
  }, [areaRef, stageRef, fromRef]);

  return (
    <>
      <div className="drop-fruit" ref={dropRef}><Fruit id={fruit} golden={golden} size="100%" /></div>
      <div className="runner" ref={sqRef} data-state="run">
        <div className="runner-face" ref={faceRef}>
          <SquirrelFigure fruit={fruit} golden={golden} />
        </div>
      </div>
    </>
  );
}
