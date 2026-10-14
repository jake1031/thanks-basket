"use client";

import { useEffect, useState } from "react";
import { Fruit } from "@/components/Fruit";
import { FRUITS, WEEKDAYS, WEEKEND, dayLabel, fruitFor, type FruitId } from "@/lib/rules";

type U = {
  id: number; nickname: string; count: number; bonus: number; fruit: FruitId;
  golden: boolean; placed: boolean; byDay: Record<string, number>;
};
type E = { id: number; date: string; content: string; nickname: string };
type Data = { today: string; users: U[]; entries: E[] };

const PW_KEY = "thanks-admin";

export default function Admin() {
  const [pw, setPw] = useState("");
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [view, setView] = useState<"users" | "entries">("users");

  async function call(method: "GET" | "POST", body?: unknown, password = pw) {
    const res = await fetch("/api/admin", {
      method,
      headers: { "content-type": "application/json", "x-admin-password": password },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error ?? "오류");
    return json;
  }

  async function load(password = pw) {
    try {
      setData(await call("GET", undefined, password));
      setError("");
      try { sessionStorage.setItem(PW_KEY, password); } catch {}
    } catch (e) { setError((e as Error).message); setData(null); }
  }

  useEffect(() => {
    let saved: string | null = null;
    try { saved = sessionStorage.getItem(PW_KEY); } catch {}
    if (saved) { setPw(saved); load(saved); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function act(body: Record<string, unknown>, confirmMsg: string) {
    if (!confirm(confirmMsg)) return;
    try { await call("POST", body); await load(); } catch (e) { alert((e as Error).message); }
  }

  function resetPin(u: U) {
    const pin = prompt(`${u.nickname}님의 새 PIN 4자리를 입력하세요`);
    if (!pin) return;
    if (!/^\d{4}$/.test(pin)) { alert("숫자 4자리로 입력해주세요."); return; }
    act({ action: "reset-pin", userId: u.id, pin }, `${u.nickname}님의 PIN을 ${pin}(으)로 바꿀까요?`);
  }

  function exportCsv() {
    if (!data) return;
    const head = ["닉네임", ...WEEKDAYS.map((d) => dayLabel(d).md), "평일합계", "토요일", "열매", "황금", "바구니"];
    const rows = data.users.map((u) => [
      u.nickname, ...WEEKDAYS.map((d) => u.byDay[d] ?? 0), u.count, u.bonus,
      fruitFor(u.count).name, u.golden ? "O" : "", u.placed ? "O" : "",
    ]);
    const csv = "﻿" + [head, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    a.download = "감사바구니_결과.csv";
    a.click();
  }

  if (!data) {
    return (
      <div className="wrap stack" style={{ maxWidth: 360, paddingTop: 80 }}>
        <h2>🔐 관리자</h2>
        <form className="stack" onSubmit={(e) => { e.preventDefault(); load(); }}>
          <input className="input" type="password" placeholder="관리자 비밀번호" value={pw} onChange={(e) => setPw(e.target.value)} />
          {error && <p className="error" style={{ margin: 0 }}>{error}</p>}
          <button className="btn block">들어가기</button>
        </form>
      </div>
    );
  }

  // 과일 등급 순서(밤→사과)로 몇 명씩인지
  const tally = FRUITS.map((f) => ({ name: f.name, n: data.users.filter((u) => u.fruit === f.id).length }));

  return (
    <div className="wrap stack" style={{ maxWidth: 960 }}>
      <div className="spread" style={{ paddingTop: 8, flexWrap: "wrap" }}>
        <div>
          <h2>🔐 관리자</h2>
          <span className="muted small">기준 날짜 {data.today}</span>
        </div>
        <div className="row">
          <button className="btn ghost" onClick={() => load()}>새로고침</button>
          <button className="btn" onClick={exportCsv}>CSV 내보내기</button>
        </div>
      </div>

      <div className="card row" style={{ flexWrap: "wrap", gap: 16 }}>
        <span>참여 <b>{data.users.length}</b>명</span>
        <span>감사 <b>{data.entries.length}</b>개</span>
        <span>바구니 <b>{data.users.filter((u) => u.placed).length}</b>명</span>
        <span>황금 <b>{data.users.filter((u) => u.golden).length}</b>명</span>
        <span className="muted">{tally.map((t) => `${t.name} ${t.n}`).join(" · ")}</span>
      </div>

      <div className="segment" style={{ maxWidth: 320 }}>
        <button className={view === "users" ? "on" : ""} onClick={() => setView("users")}>참여자</button>
        <button className={view === "entries" ? "on" : ""} onClick={() => setView("entries")}>전체 감사</button>
      </div>

      {view === "users" ? (
        <div className="card scroll-x">
          <table className="table">
            <thead>
              <tr>
                <th>닉네임</th>
                {WEEKDAYS.map((d) => <th key={d}>{dayLabel(d).md}</th>)}
                <th>합계</th>
                {WEEKEND.map((d) => <th key={d}>{dayLabel(d).md}</th>)}
                <th>열매</th><th>바구니</th><th></th>
              </tr>
            </thead>
            <tbody>
              {data.users.map((u) => (
                <tr key={u.id}>
                  <td><b>{u.nickname}</b></td>
                  {WEEKDAYS.map((d) => <td key={d}>{u.byDay[d] ?? 0}</td>)}
                  <td><b>{u.count}</b></td>
                  {WEEKEND.map((d) => <td key={d} className="muted">{u.byDay[d] ?? 0}</td>)}
                  <td><span className="row" style={{ justifyContent: "center", gap: 2 }}><Fruit id={u.fruit} golden={u.golden} size={22} />{fruitFor(u.count).name}</span></td>
                  <td>{u.placed ? "✅" : ""}</td>
                  <td>
                    <button className="link" onClick={() => resetPin(u)}>PIN 초기화</button>
                    <button className="link danger" onClick={() => act({ action: "delete-user", userId: u.id }, `${u.nickname}님과 모든 감사를 삭제할까요? 되돌릴 수 없어요.`)}>삭제</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="stack">
          {data.entries.map((e) => (
            <div key={e.id} className="note">
              <p>{e.content}</p>
              <div className="spread">
                <span className="muted small">{e.nickname} · {dayLabel(e.date).md}</span>
                <button className="link danger" onClick={() => act({ action: "delete-entry", id: e.id }, "이 감사를 삭제할까요?")}>삭제</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
