"use client";

import { useCallback, useEffect, useState } from "react";
import { Fruit, GoldDefs } from "@/components/Fruit";
import { ApiError, api, token } from "@/lib/client";
import {
  FRUITS, MAX_COUNT, MAX_LEN, PER_DAY, WEEKDAYS, WEEKEND,
  basketOpen, canEditDate, dayLabel, fruitFor, josa, nextFruit, phaseOf,
  type FruitId,
} from "@/lib/rules";

type Entry = { id: number; date: string; content: string };
type Me = {
  today: string;
  user: { nickname: string; count: number; bonus: number; fruit: FruitId; golden: boolean; placed: boolean };
  entries: Entry[];
};
type Tab = "mine" | "board" | "basket";

export default function Home() {
  const [me, setMe] = useState<Me | null>(null);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<Tab>("mine");
  const [toast, setToast] = useState<string | null>(null);

  const say = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }, []);

  const load = useCallback(async () => {
    if (!token.get()) { setMe(null); setReady(true); return; }
    try {
      setMe(await api<Me>("/api/me"));
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) { token.clear(); setMe(null); }
      else say((e as Error).message);
    }
    setReady(true);
  }, [say]);

  useEffect(() => { load(); }, [load]);

  if (!ready) return <div className="wrap hero"><p className="muted">불러오는 중…</p></div>;
  if (!me) return <Join onDone={load} />;

  return (
    <>
      <GoldDefs />
      <div className="wrap">
        {tab === "mine" && <Mine me={me} reload={load} say={say} goBasket={() => setTab("basket")} />}
        {tab === "board" && <Board say={say} />}
        {tab === "basket" && <Basket me={me} reload={load} say={say} />}
      </div>
      <nav className="tabs">
        <div className="tabs-inner">
          {([["mine", "✍️", "내 감사"], ["board", "💌", "감사 게시판"], ["basket", "🧺", "바구니"]] as const).map(([id, ico, label]) => (
            <button key={id} className={`tab ${tab === id ? "on" : ""}`} onClick={() => { setTab(id); window.scrollTo(0, 0); }}>
              <span className="ico">{ico}</span>{label}
            </button>
          ))}
        </div>
      </nav>
      {toast && <div className="toast">{toast}</div>}
    </>
  );
}

/* ───────────── 입장 ───────────── */

function Join({ onDone }: { onDone: () => void }) {
  const [mode, setMode] = useState<"new" | "login">("new");
  const [nickname, setNickname] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      const res = await api<{ token: string }>("/api/auth", { method: "POST", body: { mode, nickname, pin } });
      token.set(res.token);
      onDone();
    } catch (err) {
      setError((err as Error).message);
    }
    setBusy(false);
  }

  return (
    <div className="wrap stack">
      <GoldDefs />
      <div className="hero">
        <div className="row" style={{ justifyContent: "center", gap: 2 }}>
          {FRUITS.map((f) => <Fruit key={f.id} id={f.id} size={40} />)}
        </div>
        <h1 style={{ marginTop: 12 }}>감사 바구니</h1>
        <p className="muted">
          싱어팀 추수감사절 감사 일기<br />
          10/19(월)~10/23(금), 하루 세 가지 감사를 적어요
        </p>
      </div>

      <div className="segment">
        <button className={mode === "new" ? "on" : ""} onClick={() => { setMode("new"); setError(""); }}>처음 시작하기</button>
        <button className={mode === "login" ? "on" : ""} onClick={() => { setMode("login"); setError(""); }}>이어하기</button>
      </div>

      <form className="card stack" onSubmit={submit}>
        <label className="stack" style={{ gap: 6 }}>
          <b>닉네임</b>
          <input className="input" value={nickname} maxLength={12} placeholder="예) 소프라노 지은" onChange={(e) => setNickname(e.target.value)} />
        </label>
        <label className="stack" style={{ gap: 6 }}>
          <b>PIN 4자리</b>
          <input
            className="input pin" inputMode="numeric" type="password" autoComplete="off" maxLength={4} value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
          />
          <span className="muted small">
            {mode === "new"
              ? "다른 기기에서 이어서 쓸 때 필요해요. 꼭 기억해주세요!"
              : "처음 만들 때 정한 PIN을 입력하세요."}
          </span>
        </label>
        {error && <p className="error" style={{ margin: 0 }}>{error}</p>}
        <button className="btn block" disabled={busy || !nickname.trim() || pin.length !== 4}>
          {mode === "new" ? "시작하기" : "이어하기"}
        </button>
      </form>
      <p className="muted small" style={{ textAlign: "center" }}>
        한 번 들어오면 이 기기에서는 자동으로 입장돼요.
      </p>
    </div>
  );
}

/* ───────────── 내 감사 ───────────── */

function Mine({ me, reload, say, goBasket }: { me: Me; reload: () => Promise<void>; say: (m: string) => void; goBasket: () => void }) {
  const { today, user, entries } = me;
  const phase = phaseOf(today);
  const fruit = fruitFor(user.count);
  const next = nextFruit(user.count);

  async function logout() {
    if (!confirm("이 기기에서 로그아웃할까요? 다시 들어오려면 닉네임과 PIN이 필요해요.")) return;
    await api("/api/auth", { method: "DELETE" }).catch(() => {});
    token.clear();
    location.reload();
  }

  const byDate = (d: string) => entries.filter((e) => e.date === d);

  return (
    <div className="stack">
      <div className="spread" style={{ paddingTop: 8 }}>
        <div>
          <p className="muted small" style={{ margin: 0 }}>반가워요 🙂</p>
          <h2>{user.nickname}님의 감사</h2>
        </div>
        <button className="link" onClick={logout}>로그아웃</button>
      </div>

      <div className="card">
        <div className="progress-card">
          <div className="big-fruit"><Fruit id={fruit.id} golden={user.golden} size={64} /></div>
          <div style={{ flex: 1 }}>
            <div className="spread">
              <b>{phase === "weekend" || phase === "after" ? "이번 주 열매" : "지금 받을 열매"}: {user.golden ? "황금 " : ""}{fruit.name}</b>
              <span className="muted small">{user.count}/{MAX_COUNT}</span>
            </div>
            <div className="bar" style={{ margin: "8px 0 4px" }}><i style={{ width: `${(user.count / MAX_COUNT) * 100}%` }} /></div>
            <p className="muted small" style={{ margin: 0 }}>
              {phase === "before" && "10월 19일(월)부터 쓸 수 있어요!"}
              {phase === "weekday" && (next ? `${next.min - user.count}개 더 쓰면 ${josa(next.name, "으로", "로")} 바뀌어요!` : "최고 열매 달성! 🎉")}
              {phase === "weekend" && (user.golden ? "주말 감사로 황금 열매가 되었어요 ✨" : "주말에 감사를 쓰면 황금 열매로 바뀌어요 ✨")}
              {phase === "after" && "추수감사절 감사 일기가 끝났어요. 함께해서 고마워요!"}
            </p>
          </div>
        </div>
        <div className="tiers">
          {FRUITS.map((f) => (
            <span key={f.id} className={user.count >= f.min ? "reached" : ""}>
              <Fruit id={f.id} size={26} />{f.min}+
            </span>
          ))}
        </div>
        {basketOpen(today) && (
          <button className="btn block" style={{ marginTop: 12 }} onClick={goBasket}>
            {user.placed ? "🧺 바구니 보러 가기" : "🧺 바구니에 열매 넣으러 가기"}
          </button>
        )}
      </div>

      {(phase === "weekend" || phase === "after") && (
        <>
          <h3 style={{ marginTop: 8 }}>✨ 주말 보너스 감사</h3>
          <p className="muted small" style={{ margin: "-6px 0 0" }}>
            개수에는 들어가지 않지만, 한 개라도 쓰면 이번 주 열매가 황금색이 돼요.
          </p>
          {WEEKEND.map((d) => (
            <Day key={d} date={d} today={today} entries={byDate(d)} bonus reload={reload} say={say} />
          ))}
        </>
      )}

      <h3 style={{ marginTop: 8 }}>평일 감사</h3>
      {phase === "weekday" && (
        <p className="muted small" style={{ margin: "-6px 0 0" }}>
          지난 날짜도 금요일까지는 채울 수 있어요. 주말이 되면 잠겨요.
        </p>
      )}
      {(phase === "weekday"
        ? [...WEEKDAYS.filter((d) => d <= today).reverse(), ...WEEKDAYS.filter((d) => d > today)]
        : WEEKDAYS
      ).map((d) => (
        <Day key={d} date={d} today={today} entries={byDate(d)} reload={reload} say={say} />
      ))}
    </div>
  );
}

function Day({ date, today, entries, bonus = false, reload, say }: {
  date: string; today: string; entries: Entry[]; bonus?: boolean; reload: () => Promise<void>; say: (m: string) => void;
}) {
  const editable = canEditDate(today, date);
  const future = date > today;
  const { md, dow } = dayLabel(date);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);

  async function add() {
    if (!draft.trim()) return;
    setBusy(true);
    try {
      await api("/api/entries", { method: "POST", body: { date, content: draft } });
      setDraft("");
      await reload();
      say(entries.length + 1 === PER_DAY ? `${md} 감사 3개 완성! 🎉` : "감사가 담겼어요 🙏");
    } catch (e) { say((e as Error).message); }
    setBusy(false);
  }

  if (future && !editable) {
    return (
      <div className={`card day locked ${bonus ? "bonus" : ""}`}>
        <div className="day-head" style={{ marginBottom: 0 }}>
          <h3>{md} ({dow})</h3>
          <span className="muted small">🔒 아직 열리지 않았어요</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`card day ${date === today ? "today" : ""} ${bonus ? "bonus" : ""} ${!editable && entries.length === 0 ? "locked" : ""}`}>
      <div className="day-head">
        <h3>{md} ({dow})</h3>
        {date === today && <span className="badge brand">오늘</span>}
        {!editable && <span className="muted small">🔒</span>}
        <span className="dots">
          {Array.from({ length: PER_DAY }, (_, i) => <i key={i} className={i < entries.length ? "on" : ""} />)}
        </span>
      </div>
      <div className="stack" style={{ gap: 8 }}>
        {entries.map((e, i) => <EntryItem key={e.id} entry={e} index={i} editable={editable} reload={reload} say={say} />)}
        {editable && entries.length < PER_DAY && (
          <div className="stack" style={{ gap: 6 }}>
            <textarea
              className="textarea" maxLength={MAX_LEN} value={draft} onChange={(e) => setDraft(e.target.value)}
              placeholder={bonus ? "주말의 감사를 적어주세요" : ["오늘 감사한 일 하나", "감사한 일 둘", "마지막 감사 셋"][entries.length]}
            />
            <div className="spread">
              <span className="muted small">{draft.length}/{MAX_LEN}</span>
              <button className="btn" disabled={busy || !draft.trim()} onClick={add}>감사 담기</button>
            </div>
          </div>
        )}
        {!editable && entries.length === 0 && <p className="muted small" style={{ margin: 0 }}>기록이 없어요</p>}
      </div>
    </div>
  );
}

function EntryItem({ entry, index, editable, reload, say }: {
  entry: Entry; index: number; editable: boolean; reload: () => Promise<void>; say: (m: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(entry.content);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      await api(`/api/entries/${entry.id}`, { method: "PATCH", body: { content: text } });
      await reload();
      setEditing(false);
    } catch (e) { say((e as Error).message); }
    setBusy(false);
  }

  async function remove() {
    if (!confirm("이 감사를 지울까요?")) return;
    try {
      await api(`/api/entries/${entry.id}`, { method: "DELETE" });
      await reload();
    } catch (e) { say((e as Error).message); }
  }

  if (editing) {
    return (
      <div className="stack" style={{ gap: 6 }}>
        <textarea className="textarea" maxLength={MAX_LEN} value={text} onChange={(e) => setText(e.target.value)} autoFocus />
        <div className="row" style={{ justifyContent: "flex-end" }}>
          <button className="btn ghost" onClick={() => { setEditing(false); setText(entry.content); }}>취소</button>
          <button className="btn" disabled={busy || !text.trim()} onClick={save}>저장</button>
        </div>
      </div>
    );
  }

  return (
    <div className="entry">
      <p><span className="muted">{index + 1}. </span>{entry.content}</p>
      {editable && (
        <div className="actions">
          <button className="link" onClick={() => setEditing(true)}>수정</button>
          <button className="link danger" onClick={remove}>삭제</button>
        </div>
      )}
    </div>
  );
}

/* ───────────── 감사 게시판 ───────────── */

type BoardEntry = Entry & { mine: boolean };

function Board({ say }: { say: (m: string) => void }) {
  const [items, setItems] = useState<BoardEntry[]>([]);
  const [more, setMore] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchPage = useCallback(async (before?: number) => {
    setLoading(true);
    try {
      const res = await api<{ entries: BoardEntry[]; more: boolean }>(`/api/board${before ? `?before=${before}` : ""}`);
      setItems((prev) => (before ? [...prev, ...res.entries] : res.entries));
      setMore(res.more);
    } catch (e) { say((e as Error).message); }
    setLoading(false);
  }, [say]);

  useEffect(() => { fetchPage(); }, [fetchPage]);

  return (
    <div className="stack">
      <div style={{ paddingTop: 8 }}>
        <h2>💌 감사 게시판</h2>
        <p className="muted small" style={{ margin: "4px 0 0" }}>누가 썼는지는 보이지 않아요. 서로의 감사를 나눠요.</p>
      </div>
      {!loading && items.length === 0 && (
        <div className="card muted" style={{ textAlign: "center" }}>아직 감사가 없어요. 첫 감사를 남겨주세요!</div>
      )}
      {items.map((e) => {
        const { md, dow } = dayLabel(e.date);
        return (
          <div key={e.id} className="note">
            <p>{e.content}</p>
            <div className="spread">
              <span className="muted small">{md} ({dow}){WEEKEND.includes(e.date) && " ✨"}</span>
              {e.mine && <span className="badge">내 감사</span>}
            </div>
          </div>
        );
      })}
      {more && (
        <button className="btn ghost block" disabled={loading} onClick={() => fetchPage(items[items.length - 1]?.id)}>
          더 보기
        </button>
      )}
    </div>
  );
}

/* ───────────── 바구니 ───────────── */

type BasketData = {
  today: string;
  open: boolean;
  placed: { fruit: FruitId; golden: boolean; mine: boolean }[];
  members: number;
  totalThanks: number;
};

// 바닥부터 피라미드 모양으로 쌓기 (8,7,6,5 = 최대 26개)
const ROWS = [8, 7, 6, 5];
function slot(i: number) {
  let r = 0, idx = i;
  while (r < ROWS.length - 1 && idx >= ROWS[r]) { idx -= ROWS[r]; r++; }
  const n = ROWS[r];
  const order = Array.from({ length: n }, (_, k) => k).sort((a, b) => Math.abs(a - (n - 1) / 2) - Math.abs(b - (n - 1) / 2));
  const col = order[idx % n];
  return { left: 50 + (col - (n - 1) / 2) * 12.5, bottom: r * 22 };
}

function Basket({ me, reload, say }: { me: Me; reload: () => Promise<void>; say: (m: string) => void }) {
  const [data, setData] = useState<BasketData | null>(null);
  const [dropped, setDropped] = useState(false);
  const [busy, setBusy] = useState(false);

  const fetchBasket = useCallback(async () => {
    try { setData(await api<BasketData>("/api/basket")); } catch (e) { say((e as Error).message); }
  }, [say]);
  useEffect(() => { fetchBasket(); }, [fetchBasket]);

  async function place() {
    setBusy(true);
    try {
      await api("/api/basket", { method: "POST" });
      setDropped(true);
      await Promise.all([fetchBasket(), reload()]);
      say("바구니에 열매를 넣었어요! 🧺");
    } catch (e) { say((e as Error).message); }
    setBusy(false);
  }

  if (!data) return <p className="muted" style={{ textAlign: "center", paddingTop: 40 }}>바구니 가져오는 중…</p>;

  const { user } = me;
  const myFruit = fruitFor(user.count);
  const tally = FRUITS.map((f) => ({ ...f, n: data.placed.filter((p) => p.fruit === f.id).length })).filter((f) => f.n > 0);
  const goldN = data.placed.filter((p) => p.golden).length;
  const goal = Math.max(data.members, 1) * MAX_COUNT;

  return (
    <div className="stack">
      <div style={{ paddingTop: 8 }}>
        <h2>🧺 우리 팀 감사 바구니</h2>
        <p className="muted small" style={{ margin: "4px 0 0" }}>
          {data.placed.length}명이 열매를 넣었어요 · 함께 쓴 감사 {data.totalThanks}개
        </p>
      </div>

      <div className="card" style={{ padding: 8 }}>
        <div className="basket-stage">
          <BasketBack />
          <div className="pile">
            {data.placed.slice(0, 26).map((p, i) => {
              const s = slot(i);
              return (
                <div key={i} className={`p ${p.mine && dropped ? "drop" : ""}`} style={{ left: `${s.left}%`, bottom: `${s.bottom}%` }}>
                  <Fruit id={p.fruit} golden={p.golden} size={44} />
                </div>
              );
            })}
          </div>
          <BasketFront />
        </div>
        {tally.length > 0 ? (
          <div className="summary" style={{ marginBottom: 8 }}>
            {tally.map((f) => (
              <span key={f.id} className="chip"><Fruit id={f.id} size={24} />{f.name} {f.n}</span>
            ))}
            {goldN > 0 && <span className="chip" style={{ paddingLeft: 10 }}>✨ 황금 {goldN}</span>}
          </div>
        ) : (
          <p className="muted small" style={{ textAlign: "center" }}>아직 비어 있는 바구니예요</p>
        )}
      </div>

      <div className="card stack" style={{ gap: 8 }}>
        <div className="spread">
          <b>우리 팀 감사 진행률</b>
          <span className="muted small">{data.totalThanks} / {goal}</span>
        </div>
        <div className="bar"><i style={{ width: `${Math.min(100, (data.totalThanks / goal) * 100)}%` }} /></div>
      </div>

      {!data.open ? (
        <div className="card" style={{ textAlign: "center" }}>
          <p style={{ margin: 0 }}><b>바구니는 10/24(토)에 열려요</b></p>
          <p className="muted small" style={{ margin: "6px 0 0" }}>평일 동안 감사를 채우고, 주말에 내 열매를 넣어주세요!</p>
        </div>
      ) : user.placed ? (
        <div className="card row">
          <Fruit id={myFruit.id} golden={user.golden} size={48} />
          <div>
            <b>내 {user.golden ? "황금 " : ""}{josa(myFruit.name, "을", "를")} 넣었어요</b>
            <p className="muted small" style={{ margin: "2px 0 0" }}>
              {user.golden ? "주말 감사로 황금색이 되었어요 ✨" : "주말 감사를 쓰면 바구니 속 열매도 황금색으로 바뀌어요!"}
            </p>
          </div>
        </div>
      ) : (
        <div className="card stack" style={{ alignItems: "center", textAlign: "center" }}>
          <div className="big-fruit"><Fruit id={myFruit.id} golden={user.golden} size={88} /></div>
          <div>
            <b>이번 주 내 열매는 {user.golden ? "황금 " : ""}{myFruit.name}!</b>
            <p className="muted small" style={{ margin: "4px 0 0" }}>평일 감사 {user.count}개를 채웠어요</p>
          </div>
          <button className="btn block" disabled={busy} onClick={place}>바구니에 넣기</button>
        </div>
      )}
    </div>
  );
}

function BasketBack() {
  return (
    <svg className="basket" viewBox="0 0 400 360" aria-hidden>
      <ellipse cx="200" cy="335" rx="150" ry="14" fill="#000" opacity=".07" />
      <path d="M70 190 C70 60 330 60 330 190" fill="none" stroke="#b07a45" strokeWidth="14" strokeLinecap="round" />
      <path d="M70 190 C70 60 330 60 330 190" fill="none" stroke="#cf9a62" strokeWidth="6" strokeLinecap="round" />
      <ellipse cx="200" cy="200" rx="160" ry="26" fill="#7a4e27" />
    </svg>
  );
}

function BasketFront() {
  const weave = [];
  for (let y = 222; y < 320; y += 18) weave.push(y);
  return (
    <svg className="basket" viewBox="0 0 400 360" aria-hidden>
      <defs>
        <clipPath id="basket-body">
          <path d="M40 200 C40 226 360 226 360 200 L330 318 C330 336 70 336 70 318 Z" />
        </clipPath>
      </defs>
      <g clipPath="url(#basket-body)">
        <rect x="0" y="190" width="400" height="160" fill="#c58a4f" />
        {weave.map((y, i) => (
          <g key={y}>
            {Array.from({ length: 12 }, (_, k) => (
              <rect key={k} x={k * 36 + (i % 2 ? 18 : 0)} y={y} width="26" height="12" rx="6" fill="#a96f38" />
            ))}
          </g>
        ))}
      </g>
      <path d="M40 200 C40 230 360 230 360 200" fill="none" stroke="#e0ad72" strokeWidth="14" strokeLinecap="round" />
      <path d="M40 200 C40 230 360 230 360 200" fill="none" stroke="#9a6431" strokeWidth="3" strokeDasharray="10 8" />
    </svg>
  );
}
