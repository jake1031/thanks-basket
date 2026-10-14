import type { FruitId } from "@/lib/rules";

/** 과일 그라데이션 정의. 페이지마다 한 번만 렌더링한다. */
export function FruitDefs() {
  const radial = (id: string, stops: [number, string][]) => (
    <radialGradient id={id} cx="0.36" cy="0.32" r="0.78">
      {stops.map(([o, c]) => <stop key={o} offset={o} stopColor={c} />)}
    </radialGradient>
  );
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
      <defs>
        {radial("g-chestnut", [[0, "#b8703f"], [0.55, "#7a3d1c"], [1, "#4a210c"]])}
        {radial("g-tangerine", [[0, "#ffd27a"], [0.5, "#fb9a1e"], [1, "#d96b04"]])}
        {radial("g-persimmon", [[0, "#ffb35c"], [0.5, "#f2701a"], [1, "#bf4708"]])}
        {radial("g-pear", [[0, "#f3f6a8"], [0.5, "#cfd84a"], [1, "#94a420"]])}
        {radial("g-apple", [[0, "#ff7a72"], [0.5, "#e2303a"], [1, "#9c1420"]])}
        {radial("g-gold", [[0, "#fffbe0"], [0.35, "#ffe07a"], [0.7, "#f0b429"], [1, "#b57d07"]])}
        <linearGradient id="g-leaf" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8fd16a" />
          <stop offset="1" stopColor="#3f8a2e" />
        </linearGradient>
        <linearGradient id="g-goldleaf" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff0a8" />
          <stop offset="1" stopColor="#c99412" />
        </linearGradient>
        <linearGradient id="g-calyx" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5f9a3c" />
          <stop offset="1" stopColor="#2f6a22" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function Fruit({ id, golden = false, size = 48 }: { id: FruitId; golden?: boolean; size?: number }) {
  const body = golden ? "url(#g-gold)" : `url(#g-${id})`;
  const leaf = golden ? "url(#g-goldleaf)" : "url(#g-leaf)";
  const stem = golden ? "#a87708" : "#6b4423";

  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label={id} className={golden ? "fruit golden" : "fruit"}>
      {id === "chestnut" && (
        <>
          <path d="M32 9 C36 9 40 14 44 20 C50 28 55 36 54 44 C53 52 44 57 32 57 C20 57 11 52 10 44 C9 36 14 28 20 20 C24 14 28 9 32 9 Z" fill={body} />
          <path d="M11 43 C15 50 23 52.5 32 52.5 C41 52.5 49 50 53 43 C54 51 45 57 32 57 C19 57 10 51 11 43 Z" fill={golden ? "#ffeaa0" : "#d9b48a"} />
          <g fill={golden ? "#d6a520" : "#b8916a"} opacity="0.7">
            <circle cx="20" cy="51" r="0.9" /><circle cx="26" cy="54" r="0.9" /><circle cx="32" cy="55" r="0.9" />
            <circle cx="38" cy="54" r="0.9" /><circle cx="44" cy="51" r="0.9" />
          </g>
          <path d="M30 10.5 Q32 3 34 10.5 Z" fill={golden ? "#c99412" : "#3e1c0a"} />
          <path d="M20 24 C17 30 16 36 17 41" stroke="#fff" strokeWidth="3" strokeLinecap="round" fill="none" opacity={golden ? 0.8 : 0.35} />
        </>
      )}

      {id === "tangerine" && (
        <>
          <ellipse cx="32" cy="37" rx="22" ry="20" fill={body} />
          <g fill="#000" opacity="0.07">
            <circle cx="40" cy="30" r="0.8" /><circle cx="44" cy="38" r="0.8" /><circle cx="36" cy="46" r="0.8" />
            <circle cx="26" cy="49" r="0.8" /><circle cx="46" cy="45" r="0.8" /><circle cx="30" cy="40" r="0.8" />
          </g>
          <circle cx="32" cy="18" r="2.6" fill={golden ? "#c99412" : "#4f7d2a"} />
          <path d="M33 17.5 C37 10 46 9 49 13 C44 18 38 19 33 17.5 Z" fill={leaf} />
          <path d="M34 17 C39 14 43 13 47 13" stroke="#fff" strokeWidth="0.8" opacity="0.5" fill="none" />
          <ellipse cx="23" cy="29" rx="5" ry="3.2" fill="#fff" opacity={golden ? 0.85 : 0.5} transform="rotate(-35 23 29)" />
        </>
      )}

      {id === "persimmon" && (
        <>
          <path d="M32 20 C46 20 57 27 57 39 C57 50 46 57 32 57 C18 57 7 50 7 39 C7 27 18 20 32 20 Z" fill={body} />
          <path d="M20 24 C16 34 17 46 22 54 M44 24 C48 34 47 46 42 54" stroke="#000" strokeWidth="1.2" opacity="0.08" fill="none" />
          <g fill={golden ? "url(#g-goldleaf)" : "url(#g-calyx)"}>
            <path d="M32 22 C36 16 45 16 48 21 C43 25 36 25 32 22 Z" />
            <path d="M32 22 C28 16 19 16 16 21 C21 25 28 25 32 22 Z" />
            <path d="M32 22 C36 25 41 30 40 34 C35 32 32 27 32 22 Z" />
            <path d="M32 22 C28 25 23 30 24 34 C29 32 32 27 32 22 Z" />
          </g>
          <rect x="30.5" y="14" width="3" height="8" rx="1.5" fill={stem} />
          <ellipse cx="18" cy="35" rx="5" ry="3" fill="#fff" opacity={golden ? 0.85 : 0.45} transform="rotate(-40 18 35)" />
        </>
      )}

      {id === "pear" && (
        <>
          <path d="M32 11 C37 11 39 16 39 22 C39 28 44 31 48 36 C53 42 53 51 47 55.5 C42 59 22 59 17 55.5 C11 51 11 42 16 36 C20 31 25 28 25 22 C25 16 27 11 32 11 Z" fill={body} />
          <g fill={golden ? "#c99412" : "#7d8a1c"} opacity="0.35">
            <circle cx="38" cy="42" r="0.8" /><circle cx="44" cy="48" r="0.8" /><circle cx="30" cy="50" r="0.8" />
            <circle cx="24" cy="44" r="0.8" /><circle cx="36" cy="30" r="0.8" />
          </g>
          <path d="M32 12 C32 8 33 5.5 35.5 3.5" stroke={stem} strokeWidth="2.6" fill="none" strokeLinecap="round" />
          <path d="M34 8 C39 2.5 46 3 48.5 6.5 C43.5 10.5 38.5 10.5 34 8 Z" fill={leaf} />
          <path d="M20 40 C18 44 18 48 20 51" stroke="#fff" strokeWidth="3" strokeLinecap="round" fill="none" opacity={golden ? 0.85 : 0.45} />
          <ellipse cx="29" cy="20" rx="1.6" ry="3" fill="#fff" opacity={golden ? 0.8 : 0.4} />
        </>
      )}

      {id === "apple" && (
        <>
          <path d="M32 18 C27 13 14 12 11 26 C8 40 18 56 27 56 C30 56 31 54.5 32 54.5 C33 54.5 34 56 37 56 C46 56 56 40 53 26 C50 12 37 13 32 18 Z" fill={body} />
          <path d="M27 18 C29 20 35 20 37 18" stroke="#000" strokeWidth="1.4" opacity="0.12" fill="none" strokeLinecap="round" />
          <path d="M32 19 C32 13 33 9 36 6" stroke={stem} strokeWidth="2.8" fill="none" strokeLinecap="round" />
          <path d="M35 11 C39 4 48 4 51 8 C46 13 39 14 35 11 Z" fill={leaf} />
          <path d="M36 10.5 C41 8.5 45 8 49 8" stroke="#fff" strokeWidth="0.8" opacity="0.5" fill="none" />
          <ellipse cx="20" cy="28" rx="3.6" ry="6.5" fill="#fff" opacity={golden ? 0.85 : 0.45} transform="rotate(20 20 28)" />
          <circle cx="23" cy="38" r="1.4" fill="#fff" opacity={golden ? 0.7 : 0.3} />
        </>
      )}

      {golden && (
        <g fill="#fffbe0" className="sparkle">
          <path d="M53 8 L55 13 L60 15 L55 17 L53 22 L51 17 L46 15 L51 13 Z" />
          <path d="M9 48 L10.5 51.5 L14 53 L10.5 54.5 L9 58 L7.5 54.5 L4 53 L7.5 51.5 Z" />
        </g>
      )}
    </svg>
  );
}
