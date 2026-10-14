"use client";

import { useEffect, useState } from "react";
import { dayLabel } from "@/lib/rules";

// 개발 모드 전용 날짜 미리보기 도구 (배포 사이트에는 나타나지 않음)
const DATES = [
  ["2026-10-18", "시작 전"],
  ["2026-10-19", ""], ["2026-10-20", ""], ["2026-10-21", ""], ["2026-10-22", ""], ["2026-10-23", ""],
  ["2026-10-24", ""], ["2026-10-25", ""],
  ["2026-10-26", "끝난 후"],
] as const;

function getCookie() {
  return document.cookie.match(/(?:^|;\s*)dev_date=([^;]+)/)?.[1] ?? "";
}

export function DevBar() {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState("");
  const [demo, setDemo] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setDate(getCookie());
    try { setDemo(localStorage.getItem("dev_demo") === "1"); } catch {}
  }, []);

  async function seed(on: boolean) {
    await fetch("/api/dev", { method: "POST", body: JSON.stringify({ action: on ? "seed" : "clear" }) });
  }

  async function pick(d: string) {
    setBusy(true);
    document.cookie = d ? `dev_date=${d}; path=/; max-age=31536000` : "dev_date=; path=/; max-age=0";
    if (demo) await seed(true);
    location.reload();
  }

  async function toggleDemo() {
    setBusy(true);
    const on = !demo;
    try { localStorage.setItem("dev_demo", on ? "1" : "0"); } catch {}
    await seed(on);
    location.reload();
  }

  return (
    <div className="devbar">
      {open && (
        <div className="devbar-panel">
          <b>🛠 날짜 미리보기</b>
          <p className="muted small" style={{ margin: "2px 0 8px" }}>
            개발용 도구예요. 배포 사이트에는 안 보여요.
          </p>
          <div className="devbar-grid">
            {DATES.map(([d, label]) => {
              const { md, dow } = dayLabel(d);
              return (
                <button key={d} disabled={busy} className={date === d ? "on" : ""} onClick={() => pick(d)}>
                  {label || `${md} ${dow}`}
                </button>
              );
            })}
            <button disabled={busy} className={!date ? "on" : ""} onClick={() => pick("")}>실제 오늘</button>
          </div>
          <label className="row small" style={{ marginTop: 10 }}>
            <input type="checkbox" checked={demo} disabled={busy} onChange={toggleDemo} />
            데모 팀원 12명 채우기 (게시판·바구니 미리보기용)
          </label>
        </div>
      )}
      <button className="devbar-fab" onClick={() => setOpen(!open)}>
        🛠 {date ? `${dayLabel(date).md} ${dayLabel(date).dow}` : "오늘"}
      </button>
    </div>
  );
}
