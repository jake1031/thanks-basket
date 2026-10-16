import { useId } from "react";
import type { FruitId } from "@/lib/rules";

// 플랫 일러스트 스타일 과일. 황금 열매는 같은 모양을 금색으로 칠한다.

const GOLD = { body: "#f6c443", shade: "#e3a720", leaf: "#efd067", leafDark: "#d4ab2c", stem: "#a87708", dot: "#c9961f" };

export function Fruit({ id, golden = false, size = 48 }: { id: FruitId; golden?: boolean; size?: number | string }) {
  const clip = "c" + useId().replace(/[^a-zA-Z0-9]/g, "");
  // 황금이면 몸통·그늘·잎·꼭지를 금색 계열로 바꾼다
  const g = (natural: string, gold: string) => (golden ? gold : natural);
  const LEAF = g("#8cc152", GOLD.leaf);
  const LEAF_DARK = g("#6fa83a", GOLD.leafDark);
  const STEM = g("#7a4b23", GOLD.stem);
  const shine = golden ? 0.6 : 0.35;
  // 오른쪽 그늘: 몸통 모양으로 잘라 붙인다
  const shade = (d: string, fill: string) => <path d={d} fill={fill} clipPath={`url(#${clip})`} />;

  let body = "";
  let parts: React.ReactNode = null;

  switch (id) {
    case "apple":
      body = "M32 17 C26 11 11 12 9 27 C7 42 17 57 26 57 C29 57 30.5 55.5 32 55.5 C33.5 55.5 35 57 38 57 C47 57 57 42 55 27 C53 12 38 11 32 17 Z";
      parts = (
        <>
          <path d={body} fill={g("#e23b32", GOLD.body)} />
          {shade("M44 8 C60 20 58 52 36 62 L64 64 L64 0 Z", g("#c42e27", GOLD.shade))}
          <path d="M32 18 C32 12 33 8 36.5 4.5" stroke={STEM} strokeWidth="3.4" fill="none" strokeLinecap="round" />
          <path d="M35 11 C38 3 48 2 52 6 C48 13 40 15 35 11 Z" fill={LEAF} />
          <path d="M35 11 C41 8 46 6 52 6 C48 13 40 15 35 11 Z" fill={LEAF_DARK} />
          <ellipse cx="18" cy="27" rx="3" ry="5.5" fill="#fff" opacity={shine} transform="rotate(20 18 27)" />
        </>
      );
      break;
    case "fig":
      body = "M32 10 C 36 10 37 16 40 20 C 50 28 56 38 52 48 C 49 56 41 59 32 59 C 23 59 15 56 12 48 C 8 38 14 28 24 20 C 27 16 28 10 32 10 Z";
      parts = (
        <>
          <path d={body} fill={g("#7b4a6e", GOLD.body)} />
          {shade("M38 8 C 54 28 58 50 38 62 L64 64 L64 0 Z", g("#5e3555", GOLD.shade))}
          <path d="M24 26 C 20 36 20 46 24 54 M32 22 L32 57 M40 26 C 44 36 44 46 40 54" stroke={g("#9c6a8c", GOLD.dot)} strokeWidth="1.3" fill="none" opacity=".55" />
          <path d="M30 11 L31 5 L34 5 L34 11 Z" fill={g("#6f8a3a", GOLD.stem)} />
          <ellipse cx="20" cy="38" rx="2.4" ry="5" fill="#fff" opacity={shine} transform="rotate(15 20 38)" />
        </>
      );
      break;
    case "lemon":
      // 대각선으로 비스듬히 선 레몬. 위쪽 꼭지 끝에 잎이 붙어 있다
      body = "M8 36 C 8 30 12 28 15 26 C 22 18 42 18 49 26 C 52 28 56 30 56 36 C 56 42 52 44 49 46 C 42 54 22 54 15 46 C 12 44 8 42 8 36 Z";
      parts = (
        <g transform="rotate(-40 32 36) translate(0 -2)">
          <path d={body} fill={g("#f6d33c", GOLD.body)} />
          {shade("M8 44 C 22 60 46 58 60 40 L64 64 L0 64 Z", g("#e5bc1f", GOLD.shade))}
          <g fill={g("#d9b024", GOLD.dot)} opacity=".5">
            <circle cx="22" cy="31" r=".9" /><circle cx="30" cy="27" r=".9" /><circle cx="38" cy="30" r=".9" />
            <circle cx="26" cy="41" r=".9" /><circle cx="36" cy="43" r=".9" />
          </g>
          <path d="M56 36 L59 36" stroke={STEM} strokeWidth="2.4" strokeLinecap="round" />
          <path d="M58 36 C 60 28 66 25 70 27 C 68 33 63 37 58 36 Z" fill={LEAF} />
          <path d="M58 36 C 62 32 66 29 70 27 C 68 33 63 37 58 36 Z" fill={LEAF_DARK} />
          <ellipse cx="22" cy="31" rx="6" ry="2.4" fill="#fff" opacity={shine} transform="rotate(-10 22 31)" />
        </g>
      );
      break;
    case "pomegranate":
      body = "M32 16 C 46 16 56 26 56 39 C 56 51 45 58 32 58 C 19 58 8 51 8 39 C 8 26 18 16 32 16 Z";
      parts = (
        <>
          <path d={body} fill={g("#c8343c", GOLD.body)} />
          {shade("M42 14 C 58 26 58 50 36 62 L64 64 L64 0 Z", g("#a3252d", GOLD.shade))}
          <path d="M25 18 L24 9 L28 13 L32 7 L36 13 L40 9 L39 18 Z" fill={g("#a3252d", GOLD.shade)} />
          <path d="M27 17 L27 12 L30 14 L32 10 L34 14 L37 12 L37 17 Z" fill={g("#d9555b", GOLD.leaf)} />
          <ellipse cx="18" cy="34" rx="2.8" ry="6" fill="#fff" opacity={shine} transform="rotate(20 18 34)" />
        </>
      );
      break;
    case "mango":
      // 비스듬히 길쭉한 망고
      body = "M22 8 C 36 4 50 14 54 30 C 58 46 50 60 36 60 C 22 60 13 50 11 36 C 9 22 12 11 22 8 Z";
      parts = (
        <>
          <path d={body} fill={g("#f7b93c", GOLD.body)} />
          {shade("M46 8 C 64 30 58 58 30 64 L64 64 L64 0 Z", g("#e9a02a", GOLD.shade))}
          <path d="M22 9 C 21 6 22 3 24 2" stroke={STEM} strokeWidth="2.6" fill="none" strokeLinecap="round" />
          <path d="M23 4 C 27 0 35 0 37 3 C 33 7 27 7 23 4 Z" fill={LEAF} />
          <ellipse cx="20" cy="30" rx="2.8" ry="8" fill="#fff" opacity={shine} transform="rotate(10 20 30)" />
        </>
      );
      break;
    case "watermelon":
      body = "M32 10 C 50 10 60 22 60 36 C 60 50 48 60 32 60 C 16 60 4 50 4 36 C 4 22 14 10 32 10 Z";
      parts = (
        <>
          <path d={body} fill={g("#5aa64a", GOLD.body)} />
          {[
            "M14 14 C 8 28 8 44 16 56", "M24 10 C 18 26 18 46 24 60", "M34 10 C 30 26 30 46 34 60",
            "M44 11 C 42 26 42 46 44 59", "M53 16 C 54 28 54 44 52 55",
          ].map((d, i) => (
            <path key={i} d={d} stroke={g("#2f6e2c", GOLD.shade)} strokeWidth="4" fill="none" strokeLinecap="round"
              strokeDasharray="7 4" clipPath={`url(#${clip})`} />
          ))}
          {shade("M46 6 C 66 22 64 52 40 64 L64 64 L64 0 Z", g("#3f7f36", GOLD.shade))}
          <path d="M32 10 C 32 6 34 4 36 3" stroke={STEM} strokeWidth="2.4" fill="none" strokeLinecap="round" />
          <ellipse cx="15" cy="28" rx="3" ry="7" fill="#fff" opacity={shine * 0.8} transform="rotate(25 15 28)" />
        </>
      );
      break;
    case "persimmon":
      body = "M32 21 C47 21 58 28 58 40 C58 51 47 57 32 57 C17 57 6 51 6 40 C6 28 17 21 32 21 Z";
      parts = (
        <>
          <path d={body} fill={g("#f28b30", GOLD.body)} />
          <g fill={g("#5a9a3a", GOLD.leafDark)}>
            <path d="M32 23 C36 17 45 17 48 22 C43 26 36 26 32 23 Z" />
            <path d="M32 23 C28 17 19 17 16 22 C21 26 28 26 32 23 Z" />
            <path d="M32 23 C36 26 40 31 39 35 C34 33 32 28 32 23 Z" />
            <path d="M32 23 C28 26 24 31 25 35 C30 33 32 28 32 23 Z" />
          </g>
          <rect x="30.4" y="15" width="3.2" height="8" rx="1.6" fill={STEM} />
          <ellipse cx="16" cy="38" rx="2.6" ry="5" fill="#fff" opacity={shine} transform="rotate(-30 16 38)" />
        </>
      );
      break;
    case "tangerine":
      body = "M32 17 C45 17 54 26 54 38 C54 50 45 58 32 58 C19 58 10 50 10 38 C10 26 19 17 32 17 Z";
      parts = (
        <>
          <path d={body} fill={g("#f7a531", GOLD.body)} />
          {shade("M42 14 C56 28 54 52 36 62 L64 64 L64 0 Z", g("#ec8f1c", GOLD.shade))}
          <g fill={g("#e07f12", GOLD.dot)} opacity="0.5">
            <circle cx="24" cy="30" r="0.9" /><circle cx="38" cy="28" r="0.9" /><circle cx="20" cy="44" r="0.9" />
            <circle cx="31" cy="49" r="0.9" /><circle cx="44" cy="44" r="0.9" />
          </g>
          <circle cx="32" cy="18" r="2.6" fill={g("#5a8a2e", GOLD.stem)} />
          <path d="M33 17 C36 10 45 9 49 12 C45 18 38 19 33 17 Z" fill={LEAF} />
          <ellipse cx="19" cy="30" rx="2.6" ry="5" fill="#fff" opacity={shine} transform="rotate(35 19 30)" />
        </>
      );
      break;
    case "chestnut":
      body = "M32 9 C36 9 40 14 44 20 C50 28 55 36 54 44 C53 52 44 57 32 57 C20 57 11 52 10 44 C9 36 14 28 20 20 C24 14 28 9 32 9 Z";
      parts = (
        <>
          <path d={body} fill={g("#8b4f2a", GOLD.body)} />
          {shade("M38 6 C52 24 60 46 40 62 L64 64 L64 0 Z", g("#74401f", GOLD.shade))}
          <path d="M11 43 C15 50 23 52.5 32 52.5 C41 52.5 49 50 53 43 C54 51 45 57 32 57 C19 57 10 51 11 43 Z" fill={g("#d9b48a", "#fbe7a1")} />
          <path d="M30 10.5 Q32 3.5 34 10.5 Z" fill={g("#4a2410", GOLD.stem)} />
          <path d="M20 25 C17 30 16 35 16.5 40" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" fill="none" opacity={shine} />
        </>
      );
      break;
  }

  return (
    <svg
      width={size} height={size} viewBox="0 0 64 64" role="img" aria-label={id}
      className={golden ? "fruit golden" : "fruit"} style={{ overflow: "visible" }}
    >
      <defs>
        <clipPath id={clip}><path d={body} /></clipPath>
      </defs>
      {parts}
    </svg>
  );
}
