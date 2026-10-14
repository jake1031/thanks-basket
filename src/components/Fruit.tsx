import type { FruitId } from "@/lib/rules";

const BODY: Record<FruitId, { fill: string; shade: string }> = {
  chestnut: { fill: "#8a4b2a", shade: "#5e2f18" },
  tangerine: { fill: "#f59a23", shade: "#d9770c" },
  persimmon: { fill: "#ec6a1f", shade: "#c4500f" },
  pear: { fill: "#c9d34a", shade: "#a3ad2c" },
  apple: { fill: "#e0323a", shade: "#b31f27" },
};

const GOLD = { fill: "url(#gold-body)", shade: "#b8860b" };

export function GoldDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
      <defs>
        <linearGradient id="gold-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff3b0" />
          <stop offset="0.45" stopColor="#f5c542" />
          <stop offset="1" stopColor="#c98f12" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function Fruit({ id, golden = false, size = 48 }: { id: FruitId; golden?: boolean; size?: number }) {
  const c = golden ? GOLD : BODY[id];
  const leaf = golden ? "#d9a514" : "#4f9a3a";
  const stem = golden ? "#a87708" : "#6b4423";
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label={id} className={golden ? "fruit golden" : "fruit"}>
      {id === "chestnut" && (
        <>
          <path d="M32 8 C44 16 54 30 52 42 C50 52 42 56 32 56 C22 56 14 52 12 42 C10 30 20 16 32 8 Z" fill={c.fill} />
          <path d="M14 44 C18 54 46 54 50 44 C48 52 40 57 32 57 C24 57 16 52 14 44 Z" fill={golden ? "#fff3b0" : "#d8b48a"} />
          <path d="M30 10 L32 4 L34 10 Z" fill={c.shade} />
        </>
      )}
      {id === "tangerine" && (
        <>
          <circle cx="32" cy="36" r="22" fill={c.fill} />
          <circle cx="32" cy="16" r="2.5" fill={stem} />
          <path d="M33 15 C38 8 46 8 48 12 C42 16 37 16 33 15 Z" fill={leaf} />
        </>
      )}
      {id === "persimmon" && (
        <>
          <ellipse cx="32" cy="38" rx="24" ry="19" fill={c.fill} />
          <path d="M32 20 L22 16 L28 24 L18 26 L30 27 L32 32 L34 27 L46 26 L36 24 L42 16 Z" fill={leaf} />
          <rect x="30.5" y="13" width="3" height="7" rx="1.5" fill={stem} />
        </>
      )}
      {id === "pear" && (
        <>
          <path d="M32 12 C38 12 40 20 40 26 C40 30 52 34 52 45 C52 54 44 58 32 58 C20 58 12 54 12 45 C12 34 24 30 24 26 C24 20 26 12 32 12 Z" fill={c.fill} />
          <path d="M32 13 C32 9 34 6 36 5" stroke={stem} strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M34 9 C40 4 47 6 48 9 C42 12 38 11 34 9 Z" fill={leaf} />
        </>
      )}
      {id === "apple" && (
        <>
          <path d="M32 20 C40 12 56 16 54 34 C52 48 42 58 32 54 C22 58 12 48 10 34 C8 16 24 12 32 20 Z" fill={c.fill} />
          <path d="M32 21 C32 15 33 11 36 8" stroke={stem} strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M35 12 C41 6 49 8 50 11 C44 15 39 14 35 12 Z" fill={leaf} />
        </>
      )}
      {/* 하이라이트 */}
      <ellipse cx="23" cy="32" rx="4" ry="6" fill="#fff" opacity={golden ? 0.7 : 0.28} transform="rotate(20 23 32)" />
      {golden && (
        <g fill="#fffbe0">
          <path d="M52 8 L54 13 L59 15 L54 17 L52 22 L50 17 L45 15 L50 13 Z" />
          <path d="M10 50 L11 53 L14 54 L11 55 L10 58 L9 55 L6 54 L9 53 Z" />
        </g>
      )}
    </svg>
  );
}
