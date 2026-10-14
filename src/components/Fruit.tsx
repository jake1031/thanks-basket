import { useId } from "react";
import type { FruitId } from "@/lib/rules";

// 플랫 일러스트 스타일 과일. 황금 열매는 색은 그대로 두고 금빛 반짝이만 단다.

const LEAF = "#8cc152";
const LEAF_DARK = "#6fa83a";
const STEM = "#7a4b23";

export function Fruit({ id, golden = false, size = 48 }: { id: FruitId; golden?: boolean; size?: number | string }) {
  const clip = "c" + useId().replace(/[^a-zA-Z0-9]/g, "");
  // 오른쪽 그늘: 몸통 모양으로 잘라 붙인다
  const shade = (d: string, fill: string) => <path d={d} fill={fill} clipPath={`url(#${clip})`} />;

  let body = "";
  let parts: React.ReactNode = null;

  switch (id) {
    case "apple":
      body = "M32 17 C26 11 11 12 9 27 C7 42 17 57 26 57 C29 57 30.5 55.5 32 55.5 C33.5 55.5 35 57 38 57 C47 57 57 42 55 27 C53 12 38 11 32 17 Z";
      parts = (
        <>
          <path d={body} fill="#e23b32" />
          {shade("M44 8 C60 20 58 52 36 62 L64 64 L64 0 Z", "#c42e27")}
          <path d="M32 18 C32 12 33 8 36.5 4.5" stroke={STEM} strokeWidth="3.4" fill="none" strokeLinecap="round" />
          <path d="M35 11 C38 3 48 2 52 6 C48 13 40 15 35 11 Z" fill={LEAF} />
          <path d="M35 11 C41 8 46 6 52 6 C48 13 40 15 35 11 Z" fill={LEAF_DARK} />
          <ellipse cx="18" cy="27" rx="3" ry="5.5" fill="#fff" opacity="0.35" transform="rotate(20 18 27)" />
        </>
      );
      break;
    case "pear":
      body = "M32 12 C37 12 39 17 39 23 C39 29 44 32 48 37 C53 43 53 52 47 56 C42 59.5 22 59.5 17 56 C11 52 11 43 16 37 C20 32 25 29 25 23 C25 17 27 12 32 12 Z";
      parts = (
        <>
          <path d={body} fill="#f2c94c" />
          {shade("M40 10 C46 30 60 46 40 62 L64 64 L64 0 Z", "#e2b53a")}
          <g fill="#c99a2c" opacity="0.55">
            <circle cx="24" cy="44" r="0.9" /><circle cx="30" cy="51" r="0.9" /><circle cx="38" cy="44" r="0.9" />
            <circle cx="21" cy="51" r="0.9" /><circle cx="33" cy="33" r="0.9" />
          </g>
          <path d="M32 13 C32 9 33 6 35.5 3.5" stroke={STEM} strokeWidth="3" fill="none" strokeLinecap="round" />
          <ellipse cx="22" cy="42" rx="2.4" ry="4.5" fill="#fff" opacity="0.35" transform="rotate(15 22 42)" />
        </>
      );
      break;
    case "persimmon":
      body = "M32 21 C47 21 58 28 58 40 C58 51 47 57 32 57 C17 57 6 51 6 40 C6 28 17 21 32 21 Z";
      parts = (
        <>
          <path d={body} fill="#f28b30" />
          {shade("M42 18 C54 30 54 50 38 62 L64 64 L64 0 Z", "#e0741f")}
          <g fill="#5a9a3a">
            <path d="M32 23 C36 17 45 17 48 22 C43 26 36 26 32 23 Z" />
            <path d="M32 23 C28 17 19 17 16 22 C21 26 28 26 32 23 Z" />
            <path d="M32 23 C36 26 40 31 39 35 C34 33 32 28 32 23 Z" />
            <path d="M32 23 C28 26 24 31 25 35 C30 33 32 28 32 23 Z" />
          </g>
          <rect x="30.4" y="15" width="3.2" height="8" rx="1.6" fill={STEM} />
          <ellipse cx="16" cy="38" rx="2.6" ry="5" fill="#fff" opacity="0.3" transform="rotate(-30 16 38)" />
        </>
      );
      break;
    case "tangerine":
      body = "M32 17 C45 17 54 26 54 38 C54 50 45 58 32 58 C19 58 10 50 10 38 C10 26 19 17 32 17 Z";
      parts = (
        <>
          <path d={body} fill="#f7a531" />
          {shade("M42 14 C56 28 54 52 36 62 L64 64 L64 0 Z", "#ec8f1c")}
          <g fill="#e07f12" opacity="0.5">
            <circle cx="24" cy="30" r="0.9" /><circle cx="38" cy="28" r="0.9" /><circle cx="20" cy="44" r="0.9" />
            <circle cx="31" cy="49" r="0.9" /><circle cx="44" cy="44" r="0.9" />
          </g>
          <circle cx="32" cy="18" r="2.6" fill="#5a8a2e" />
          <path d="M33 17 C36 10 45 9 49 12 C45 18 38 19 33 17 Z" fill={LEAF} />
          <ellipse cx="19" cy="30" rx="2.6" ry="5" fill="#fff" opacity="0.35" transform="rotate(35 19 30)" />
        </>
      );
      break;
    case "chestnut":
      body = "M32 9 C36 9 40 14 44 20 C50 28 55 36 54 44 C53 52 44 57 32 57 C20 57 11 52 10 44 C9 36 14 28 20 20 C24 14 28 9 32 9 Z";
      parts = (
        <>
          <path d={body} fill="#8b4f2a" />
          {shade("M38 6 C52 24 60 46 40 62 L64 64 L64 0 Z", "#74401f")}
          <path d="M11 43 C15 50 23 52.5 32 52.5 C41 52.5 49 50 53 43 C54 51 45 57 32 57 C19 57 10 51 11 43 Z" fill="#d9b48a" />
          <path d="M30 10.5 Q32 3.5 34 10.5 Z" fill="#4a2410" />
          <path d="M20 25 C17 30 16 35 16.5 40" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" fill="none" opacity="0.3" />
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
      {golden && (
        <g className="sparkle">
          <path d="M52 2 L54.2 8.8 L61 11 L54.2 13.2 L52 20 L49.8 13.2 L43 11 L49.8 8.8 Z" fill="#f6c443" stroke="#fff" strokeWidth="1.2" strokeLinejoin="round" />
        </g>
      )}
    </svg>
  );
}
