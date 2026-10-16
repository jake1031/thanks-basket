"use client";

import { useEffect, useState } from "react";

// 바구니 탭을 열 때: 화면을 덮은 숲속 나뭇잎이 바스락 흔들리다 양옆으로 헤쳐지며 바구니가 드러난다.

const GREENS = ["#2f6b3a", "#3b7d43", "#4a9150", "#5ea45c", "#77b86a", "#8cc152"];
const AUTUMN = ["#e0a12a", "#d9772a", "#c4502a"];

/** 항상 같은 배치가 나오는 간단한 난수 */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

type Leaf = { x: number; y: number; r: number; s: number; c: string; vein: string };

function makeLeaves(seed: number, count: number, autumnRate: number): Leaf[] {
  const rnd = seeded(seed);
  return Array.from({ length: count }, () => {
    const autumn = rnd() < autumnRate;
    const c = autumn ? AUTUMN[Math.floor(rnd() * AUTUMN.length)] : GREENS[Math.floor(rnd() * GREENS.length)];
    return {
      // 덩어리 바깥까지 삐져나오게 흩뿌려서 가운데 이음선이 보이지 않게 한다
      x: rnd() * 420 - 60,
      y: rnd() * 640 - 20,
      r: rnd() * 360,
      s: 0.7 + rnd() * 0.9,
      c,
      vein: autumn ? "#8a3d14" : "#1f4a27",
    };
  });
}

function LeafCluster({ leaves }: { leaves: Leaf[] }) {
  return (
    <svg viewBox="0 0 300 600" preserveAspectRatio="xMidYMid slice" style={{ overflow: "visible" }} aria-hidden>
      {leaves.map((l, i) => (
        <g key={i} transform={`translate(${l.x} ${l.y}) rotate(${l.r}) scale(${l.s})`}>
          <path d="M0 0 C 14 -26 50 -30 78 0 C 50 30 14 26 0 0 Z" fill={l.c} />
          <path d="M2 0 L74 0 M22 0 L34 -10 M40 0 L52 -11 M22 0 L34 10 M40 0 L52 11" stroke={l.vein} strokeWidth="1.6" opacity=".35" fill="none" strokeLinecap="round" />
        </g>
      ))}
    </svg>
  );
}

// 뒤 → 앞 순서. 앞쪽 잎일수록 크고 빨리 헤쳐진다.
const LAYERS = [
  { seed: 11, count: 70, autumn: 0.08, delay: 0.32, dur: 1.15 },
  { seed: 23, count: 60, autumn: 0.12, delay: 0.24, dur: 1.0 },
  { seed: 37, count: 48, autumn: 0.18, delay: 0.16, dur: 0.85 },
];

export function ForestIntro({ onDone }: { onDone: () => void }) {
  const [layers] = useState(() =>
    LAYERS.map((l) => ({
      ...l,
      left: makeLeaves(l.seed, l.count, l.autumn),
      right: makeLeaves(l.seed + 100, l.count, l.autumn),
    })),
  );

  useEffect(() => {
    // '동작 줄이기' 설정이면 연출 없이 바로 넘어간다
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      onDone();
      return;
    }
    const t = setTimeout(onDone, 1650);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="forest" onClick={onDone} role="presentation">
      <div className="forest-light" />
      {layers.map((l, i) => (
        <div key={i} className="forest-layer" style={{ ["--d" as string]: `${l.delay}s`, ["--t" as string]: `${l.dur}s`, zIndex: i + 1 }}>
          <div className="leaves left"><LeafCluster leaves={l.left} /></div>
          <div className="leaves right"><LeafCluster leaves={l.right} /></div>
        </div>
      ))}
    </div>
  );
}
