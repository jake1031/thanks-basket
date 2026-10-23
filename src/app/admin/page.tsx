"use client";

import { useEffect, useState } from "react";
import { Fruit } from "@/components/Fruit";
import { FRUIT_NAMES, TIERS, WEEKDAYS, WEEKEND, dayLabel, type FruitId } from "@/lib/rules";

type U = {
  id: number; nickname: string; realName: string; count: number; bonus: number; tier: number; fruit: FruitId;
  golden: boolean; placed: boolean; byDay: Record<string, number>;
};
type E = { id: number; date: string; content: string; nickname: string };
type C = { id: number; date: string; content: string; author: string; target: string };
type Data = { today: string; users: U[]; entries: E[]; comments: C[] };

const PW_KEY = "thanks-admin";

/** 관리자 화면에서만: 닉네임 (이름) */
const label = (u: { nickname: string; realName: string }) => (u.realName ? `${u.nickname} (${u.realName})` : u.nickname);

export default function Admin() {
  const [pw, setPw] = useState("");
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [view, setView] = useState<"users" | "entries" | "comments">("users");
  const [openId, setOpenId] = useState<number | null>(null); // 펼쳐 본 참여자

  async function call(method: "GET" | "POST", body?: unknown, password = pw) {
    const res = await fetch("/api/admin", {
      method,
      headers: { "content-type": "application/json", "x-admin-password": password },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error ?? `오류 (${res.status})`);
    return json;
  }

  async function load(password = pw) {
    try {
      setData(await call("GET", undefined, password));
      setError("");
      try { sessionStorage.setItem(PW_KEY, password); } catch {}
    } catch (e) {
      setData(null);
      // DB 문제면 원인을 보여준다 (관리자 비밀번호가 맞을 때만 응답함)
      const h = await fetch("/api/health", { headers: { "x-admin-password": password }, cache: "no-store" })
        .then((r) => r.json()).catch(() => null);
      setError(h && h.ok === false ? `DB 연결 오류 (${h.host}) ${h.code ?? ""}: ${h.message}` : (e as Error).message);
    }
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
    const pin = prompt(`${label(u)}님의 새 PIN 4자리를 입력하세요`);
    if (!pin) return;
    if (!/^\d{4}$/.test(pin)) { alert("숫자 4자리로 입력해주세요."); return; }
    act({ action: "reset-pin", userId: u.id, pin }, `${u.nickname}님의 PIN을 ${pin}(으)로 바꿀까요?`);
  }

  function download(name: string, table: (string | number)[][]) {
    const csv = "\uFEFF" + table.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    a.download = name;
    a.click();
  }

  function exportCsv() {
    if (!data) return;
    const head = ["닉네임", "이름", ...WEEKDAYS.map((d) => dayLabel(d).md), "평일합계", "토요일"];
    const rows = data.users.map((u) => [
      u.nickname, u.realName, ...WEEKDAYS.map((d) => u.byDay[d] ?? 0), u.count, u.bonus > 0 ? "O" : "X",
    ]);
    download("감사바구니_결과.csv", [head, ...rows]);
  }

  /** 전체 감사 내용: 사람·날짜마다 한 줄, 그날 감사는 쓴 순서대로 쉼표로 이어서. 닉네임·이름은 그 사람 첫 줄에만 */
  function exportEntries() {
    if (!data) return;
    const nameOf = new Map(data.users.map((u) => [u.nickname, u.realName]));
    const sorted = [...data.entries].sort((x, y) =>
      x.nickname.localeCompare(y.nickname, "ko") || x.date.localeCompare(y.date) || x.id - y.id);
    const byDay = new Map<string, E[]>();
    for (const e of sorted) {
      const key = `${e.nickname}|${e.date}`;
      byDay.set(key, [...(byDay.get(key) ?? []), e]);
    }
    let prev = "";
    const rows = [...byDay.values()].map((list) => {
      const { nickname, date } = list[0];
      const first = nickname !== prev;
      prev = nickname;
      const { md, dow } = dayLabel(date);
      return [
        first ? nickname : "", first ? nameOf.get(nickname) ?? "" : "",
        `${md} (${dow})`, list.map((e) => e.content).join(", "),
      ];
    });
    download("감사바구니_감사내용.csv", [["닉네임", "이름", "날짜", "감사"], ...rows]);
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

  // 단계별로 몇 명씩인지 (실제 선물 기준)
  const tally = TIERS.map((t) => data.users.filter((u) => u.tier === t.level).length);
  const REP: FruitId[] = ["chestnut", "fig", "apple", "chamoe", "watermelon"];

  return (
    <div className="wrap stack admin">
      <div className="spread" style={{ paddingTop: 4, flexWrap: "wrap" }}>
        <div>
          <h2>🔐 관리자</h2>
          <span className="muted small">기준 날짜 {data.today}</span>
        </div>
        <div className="row">
          <button className="btn ghost btn-sm" style={{ marginTop: 0 }} onClick={() => load()}>새로고침</button>
          <button className="btn btn-sm" style={{ marginTop: 0 }} onClick={exportCsv}>결과 CSV</button>
          <button className="btn btn-sm" style={{ marginTop: 0 }} onClick={exportEntries}>감사 내용 CSV</button>
        </div>
      </div>

      <div className="card admin-summary">
        <div className="stat"><span>👥 참여자</span><b>{data.users.length}<small>명</small></b></div>
        <div className="stat"><span>✍️ 총 감사</span><b>{data.entries.length}<small>개</small></b></div>
        <div className="stat"><span>✨ 황금 열매</span><b>{data.users.filter((u) => u.golden).length}<small>명</small></b></div>
        <div className="fruit-tally">
          {TIERS.map((t, i) => (
            <span key={t.level} title={`${t.level}단계 ${t.name}`}>
              <Fruit id={REP[i]} size={22} /><b>{tally[i]}</b><small>명</small>
            </span>
          ))}
        </div>
      </div>

      <div className="segment">
        <button className={view === "users" ? "on" : ""} onClick={() => setView("users")}>참여자</button>
        <button className={view === "entries" ? "on" : ""} onClick={() => setView("entries")}>전체 감사</button>
        <button className={view === "comments" ? "on" : ""} onClick={() => setView("comments")}>댓글 {data.comments.length}</button>
      </div>

      {view === "users" ? (
        <div className="card admin-list">
          {data.users.map((u) => (
            <div key={u.id} className={`admin-row ${openId === u.id ? "open" : ""}`}>
              <button className="admin-row-main" onClick={() => setOpenId(openId === u.id ? null : u.id)}>
                <Fruit id={u.fruit} golden={u.golden} size={28} />
                <span className="admin-name">
                  <b>{label(u)}</b>
                  <small>
                    {u.tier}단계 · {u.count}개{u.placed ? ` · ${u.golden ? "황금 " : ""}${FRUIT_NAMES[u.fruit]}` : u.golden ? " · 황금" : ""}
                  </small>
                </span>
                <span className="admin-mini">
                  {[...WEEKDAYS, ...WEEKEND].map((d) => <i key={d} className={`n${Math.min(u.byDay[d] ?? 0, 3)}`} />)}
                </span>
              </button>
              {openId === u.id && (
                <div className="admin-row-detail">
                  <div className="admin-days">
                    {[...WEEKDAYS, ...WEEKEND].map((d) => {
                      const n = u.byDay[d] ?? 0;
                      return <span key={d} className={n ? "on" : ""}><i>{dayLabel(d).dow}</i>{n}</span>;
                    })}
                  </div>
                  <div className="row" style={{ justifyContent: "flex-end", marginTop: 6 }}>
                    <span>
                      <button className="link" onClick={() => resetPin(u)}>PIN 초기화</button>
                      <button className="link danger" onClick={() => act({ action: "delete-user", userId: u.id }, `${u.nickname}님과 모든 감사를 삭제할까요? 되돌릴 수 없어요.`)}>삭제</button>
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : view === "comments" ? (
        <div className="card admin-list" style={{ padding: 8 }}>
          {data.comments.length === 0 && <p className="muted small" style={{ textAlign: "center" }}>아직 댓글이 없어요</p>}
          {data.comments.map((c) => (
            <div key={c.id} className="comment" style={{ margin: 4 }}>
              <div className="spread">
                <b>{c.author} → {c.target} <span className="muted small">{dayLabel(c.date).md}</span></b>
                <button className="link danger" style={{ padding: 0 }} onClick={() => act({ action: "delete-comment", id: c.id }, "이 댓글을 삭제할까요?")}>삭제</button>
              </div>
              <p>{c.content}</p>
            </div>
          ))}
        </div>
      ) : (
        <PersonEntries
          users={data.users} entries={data.entries}
          onDelete={(id) => act({ action: "delete-entry", id }, "이 감사를 삭제할까요?")}
        />
      )}
    </div>
  );
}

/** 사람을 고르면 그 사람의 날짜별 감사를 카드로 넘겨보기 */
function PersonEntries({ users, entries, onDelete }: { users: U[]; entries: E[]; onDelete: (id: number) => void }) {
  const [who, setWho] = useState<string>(users[0]?.nickname ?? "");
  const mine = entries.filter((e) => e.nickname === who);
  const idx = users.findIndex((u) => u.nickname === who);
  const days = [...WEEKDAYS, ...WEEKEND];

  return (
    <div className="admin-entries">
      <div className="person-picker">
        <button className="btn ghost" disabled={idx <= 0} onClick={() => setWho(users[idx - 1].nickname)} aria-label="이전 사람">‹</button>
        <select className="input" value={who} onChange={(e) => setWho(e.target.value)}>
          {users.map((u) => (
            <option key={u.id} value={u.nickname}>
              {label(u)} · {entries.filter((e) => e.nickname === u.nickname).length}개
            </option>
          ))}
        </select>
        <button className="btn ghost" disabled={idx >= users.length - 1} onClick={() => setWho(users[idx + 1].nickname)} aria-label="다음 사람">›</button>
      </div>
      {mine.length === 0 ? (
        <div className="card muted" style={{ textAlign: "center" }}>{who}님은 아직 쓴 감사가 없어요</div>
      ) : (
        <div className="swipe" key={who}>
          {days.map((d, i) => {
            const list = mine.filter((e) => e.date === d).sort((a, b) => a.id - b.id);
            const { md, dow } = dayLabel(d);
            return (
              <div key={d} className={`swipe-card tone-${i % 4}`} style={{ minHeight: 220 }}>
                <div className="spread">
                  <b className="card-name">{md} ({dow}){WEEKEND.includes(d) && " ✨"}</b>
                  <span className="muted small">{list.length}개</span>
                </div>
                {list.length === 0 ? (
                  <p className="muted small" style={{ marginTop: 14 }}>이날은 쓴 감사가 없어요</p>
                ) : (
                  <ol>
                    {list.map((e) => (
                      <li key={e.id}>
                        {e.content}{" "}
                        <button className="link danger" style={{ padding: "0 4px" }} onClick={() => onDelete(e.id)}>삭제</button>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            );
          })}
        </div>
      )}
      <p className="muted small" style={{ textAlign: "center", margin: 0 }}>← 옆으로 넘기면 날짜별로 볼 수 있어요 →</p>
    </div>
  );
}
