"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Fruit } from "@/components/Fruit";
import { ForestIntro } from "@/components/ForestIntro";
import { ApiError, api, token } from "@/lib/client";
import {
  ALL_FRUITS, COMMENT_LEN, EVENT_DAYS as DAYS, FRUIT_NAMES, MAX_COUNT, MAX_LEN, PER_DAY, TIERS, WEEKDAYS, WEEKEND,
  basketOpen, canEditDate, dayLabel, josa, nextTier, phaseOf, tierFor, tierOf, unlockedFruits,
  type FruitId,
} from "@/lib/rules";

type Entry = { id: number; date: string; content: string };
type Me = {
  today: string;
  user: { nickname: string; count: number; bonus: number; tier: number; fruit: FruitId; golden: boolean; placed: boolean };
  entries: Entry[];
};
type Tab = "mine" | "board" | "basket";

export default function Home() {
  const [me, setMe] = useState<Me | null>(null);
  const [ready, setReady] = useState(false);
  const [tab, setTabState] = useState<Tab>("mine");
  const [focusDate, setFocusDate] = useState<string | null>(null); // 게시판에서 '쓰러 가기'로 넘어올 날짜
  const setTab = useCallback((t: Tab) => {
    setTabState(t);
    try { sessionStorage.setItem("thanks-tab", t); } catch {}
  }, []);
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("thanks-tab") as Tab | null;
      if (saved === "mine" || saved === "board" || saved === "basket") setTabState(saved);
    } catch {}
  }, []);
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
  const current: Tab = tab;

  return (
    <>
      <div className="wrap">
        {current === "mine" && <Mine key={focusDate ?? ""} me={me} initialDate={focusDate} reload={load} say={say} goBasket={() => setTab("basket")} />}
        {current === "board" && (
          <Board today={me.today} say={say} goWrite={(d) => { setFocusDate(d); setTab("mine"); window.scrollTo(0, 0); }} />
        )}
        {current === "basket" && <Basket me={me} reload={load} say={say} />}
      </div>
      <nav className="tabs">
        <div className="tabs-inner">
          {([["mine", "✍️", "내 감사"], ["board", "💌", "감사 게시판"], ["basket", "🧺", "바구니"]] as const)
            .map(([id, ico, label]) => (
            <button key={id} className={`tab ${current === id ? "on" : ""}`} onClick={() => { setTab(id); window.scrollTo(0, 0); }}>
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

const NICK_EXAMPLES = [
  "세수하는 토끼", "노래하는 다람쥐", "낮잠 자는 판다", "춤추는 고슴도치",
  "밥 먹는 펭귄", "산책하는 거북이", "기지개 켜는 고양이", "웃는 수달",
];

function Join({ onDone }: { onDone: () => void }) {
  const [mode, setMode] = useState<"new" | "login">("new");
  const [nickname, setNickname] = useState("");
  const [realName, setRealName] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [example] = useState(() => NICK_EXAMPLES[Math.floor(Math.random() * NICK_EXAMPLES.length)]);
  const [names, setNames] = useState<string[] | null>(null);

  useEffect(() => {
    if (mode !== "login") return;
    api<{ nicknames: string[] }>("/api/auth").then((r) => setNames(r.nicknames)).catch(() => setNames([]));
  }, [mode]);

  function switchMode(m: "new" | "login") {
    setMode(m); setError(""); setPin("");
    if (m === "login") setNickname("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      const res = await api<{ token: string }>("/api/auth", { method: "POST", body: { mode, nickname, pin, realName } });
      token.set(res.token);
      onDone();
    } catch (err) {
      setError((err as Error).message);
    }
    setBusy(false);
  }

  return (
    <div className="wrap stack">
      <div className="hero">
        <div className="row" style={{ justifyContent: "center", gap: 2 }}>
          {REP_FRUITS.map((f) => <Fruit key={f} id={f} size={40} />)}
        </div>
        <h1 style={{ marginTop: 12 }}>감사 바구니</h1>
        <p className="muted">
          싱어팀 추수감사절 감사 일기<br />
          10/19(월)~10/23(금), 하루 세 가지 감사를 적어요
        </p>
      </div>

      <div className="segment">
        <button className={mode === "new" ? "on" : ""} onClick={() => switchMode("new")}>처음 시작하기</button>
        <button className={mode === "login" ? "on" : ""} onClick={() => switchMode("login")}>이어하기</button>
      </div>

      <form className="card stack" onSubmit={submit}>
        {mode === "new" ? (
          <>
            <label className="stack" style={{ gap: 6 }}>
              <b>이름</b>
              <input className="input" value={realName} maxLength={10} placeholder="예) 홍길동" onChange={(e) => setRealName(e.target.value)} />
              <span className="muted small">다른 팀원에게는 닉네임만 보여요.</span>
            </label>
            <label className="stack" style={{ gap: 6 }}>
              <b>닉네임</b>
              <input className="input" value={nickname} maxLength={12} placeholder={`예) ${example}`} onChange={(e) => setNickname(e.target.value)} />
            </label>
          </>
        ) : (
          <div className="stack" style={{ gap: 6 }}>
            <b>내 닉네임을 골라주세요</b>
            {names === null ? (
              <p className="muted small" style={{ margin: 0 }}>불러오는 중…</p>
            ) : names.length === 0 ? (
              <p className="muted small" style={{ margin: 0 }}>아직 가입한 사람이 없어요. &apos;처음 시작하기&apos;를 눌러주세요.</p>
            ) : (
              <div className="name-grid">
                {names.map((n) => (
                  <button type="button" key={n} className={nickname === n ? "on" : ""} onClick={() => { setNickname(n); setError(""); }}>
                    {n}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        {(mode === "new" || nickname) && <label className="stack" style={{ gap: 6 }}>
          <b>{mode === "login" ? `${nickname}님의 PIN 4자리` : "PIN 4자리"}</b>
          <input
            className="input pin" inputMode="numeric" type="password" autoComplete="off" maxLength={4} value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
          />
          <span className="muted small">
            {mode === "new"
              ? "다른 기기에서 이어서 쓸 때 필요해요. 꼭 기억해주세요!"
              : "처음 만들 때 정한 PIN을 입력하세요."}
          </span>
        </label>}
        {error && <p className="error" style={{ margin: 0 }}>{error}</p>}
        <button className="btn block" disabled={busy || !nickname.trim() || pin.length !== 4 || (mode === "new" && !realName.trim())}>
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

function Mine({ me, initialDate, reload, say, goBasket }: {
  me: Me; initialDate: string | null; reload: () => Promise<void>; say: (m: string) => void; goBasket: () => void;
}) {
  const { today, user, entries } = me;
  const phase = phaseOf(today);
  const tier = tierFor(user.count);
  const next = nextTier(user.count);
  const [book, setBook] = useState(false);
  // 단계가 올라가면 새 열매 해금 알림
  const prevTier = useRef(tier.level);
  useEffect(() => {
    if (tier.level > prevTier.current) say(`🔓 새 열매가 열렸어요! ${tier.fruits.map((f) => FRUIT_NAMES[f]).join(" · ")}`);
    prevTier.current = tier.level;
  }, [tier.level, tier.fruits, say]);

  async function logout() {
    if (!confirm("이 기기에서 로그아웃할까요? 다시 들어오려면 닉네임과 PIN이 필요해요.")) return;
    await api("/api/auth", { method: "DELETE" }).catch(() => {});
    token.clear();
    location.reload();
  }

  const byDate = (d: string) => entries.filter((e) => e.date === d);
  const [sel, setSel] = useState(() => (initialDate && DAYS.includes(initialDate) ? initialDate : defaultDay(today)));

  return (
    <div className="stack" style={{ gap: 12 }}>
      <div className="card" style={{ padding: "12px 16px 14px" }}>
        <div className="spread">
          <b className="hello">🎤 {user.nickname}님</b>
          <button className="link" onClick={logout}>로그아웃</button>
        </div>
        <div className="row tier-row" style={{ gap: 12, marginTop: 6 }}>
          <button className="tier-icons" onClick={() => setBook(true)} aria-label="열매 바꾸기">
            <Fruit id={user.fruit} golden={user.golden} size={44} />
            <span className="swap">⇄</span>
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <b>
              {user.golden ? "황금 " : ""}{FRUIT_NAMES[user.fruit]}
            </b>
            <p className="muted small" style={{ margin: "2px 0 0" }}>
              {phase === "before" && "10월 19일(월)부터 쓸 수 있어요!"}
              {phase === "weekday" && (next ? `${next.min - user.count}개 더 쓰면 새 열매가 열려요!` : "모든 열매를 모았어요! 🎉")}
              {phase === "weekend" && (user.placed ? "바구니에 쏙 넣었어요 🧺" : user.golden ? "황금 열매가 되었어요 ✨" : "토요일 감사로 황금 열매에 도전! ✨")}
              {phase === "after" && "함께해서 고마워요! 🙏"}
            </p>
          </div>
          <span className="count">{user.count}<small>/{MAX_COUNT}</small></span>
        </div>
        {/* 진행 막대 위에 단계가 바뀌는 개수 */}
        <div className="track">
          <div className="marks nums">
            {TIERS.map((t) => (
              <span key={t.level} className={user.count >= t.min ? "reached" : ""} style={{ left: `${gaugePos(t.min)}%` }}>
                {Math.max(t.min, 1)}
              </span>
            ))}
          </div>
          <div className="bar"><i style={{ width: `${gaugePos(user.count)}%` }} /></div>
        </div>
        {basketOpen(today) && (
          <button className="btn block btn-sm" onClick={goBasket}>
            {user.placed ? "🧺 바구니 보러 가기" : "🧺 바구니에 열매 넣으러 가기"}
          </button>
        )}
      </div>

      {book && (
        <FruitBook
          count={user.count} golden={user.golden} value={user.fruit}
          onPick={(f) => changeFruit(f, user.placed, reload, say)}
          onClose={() => setBook(false)}
        />
      )}

      <DayTabs
        today={today} sel={sel} onSel={setSel}
        dim={(d) => !canEditDate(today, d) && byDate(d).length === 0}
        sub={(d) => (
          <span className="mini-dots">
            {Array.from({ length: PER_DAY }, (_, i) => <i key={i} className={i < byDate(d).length ? "on" : ""} />)}
          </span>
        )}
      />

      <Day key={sel} date={sel} today={today} entries={byDate(sel)} bonus={WEEKEND.includes(sel)} reload={reload} say={say} />
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
      {bonus && (
        <p className="muted small" style={{ margin: "-4px 0 10px" }}>
          ✨ 개수엔 안 들어가지만, 하나라도 쓰면 황금 열매가 돼요
        </p>
      )}
      <div className="stack" style={{ gap: 10 }}>
        {entries.map((e, i) => <EntryItem key={e.id} entry={e} index={i} editable={editable} reload={reload} say={say} />)}
        {editable && entries.length < PER_DAY && (
          <div className="composer">
            <textarea
              className="textarea" rows={2} maxLength={MAX_LEN} value={draft} onChange={(e) => setDraft(e.target.value)}
              placeholder={bonus ? "토요일, 무엇이 감사했나요?" : [date === today ? "오늘, 무엇이 감사했나요?" : "이날, 무엇이 감사했나요?", "또 어떤 순간이 감사했나요?", "마지막 감사를 채워주세요"][entries.length]}
            />
            <button className="btn" disabled={busy || !draft.trim()} onClick={add}>담기</button>
            {draft.length > MAX_LEN - 30 && <span className="muted small counter">{draft.length}/{MAX_LEN}</span>}
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
          <button className="icon-btn" aria-label="수정" onClick={() => setEditing(true)}>✏️</button>
          <button className="icon-btn" aria-label="삭제" onClick={remove}>🗑️</button>
        </div>
      )}
    </div>
  );
}

/* ───────────── 감사 게시판 ───────────── */

type BoardCard = { userId: number; nickname: string; mine: boolean; entries: string[]; comments: number };

function Board({ today, say, goWrite }: { today: string; say: (m: string) => void; goWrite: (date: string) => void }) {
  const [sel, setSel] = useState(() => defaultDay(today));
  const [people, setPeople] = useState<Record<string, number>>({});
  const [cards, setCards] = useState<BoardCard[] | null>(null);
  const [commentFor, setCommentFor] = useState<BoardCard | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    setCards(null);
    trackRef.current?.scrollTo({ left: 0 });
    api<{ people: Record<string, number>; cards: BoardCard[] }>(`/api/board?date=${sel}`)
      .then((r) => { if (alive) { setPeople(r.people); setCards(r.cards); } })
      .catch((e) => say((e as Error).message));
    return () => { alive = false; };
  }, [sel, say]);

  function go(i: number) {
    const el = trackRef.current;
    if (!el || !el.firstElementChild) return;
    const w = (el.firstElementChild as HTMLElement).offsetWidth + 12;
    el.scrollTo({ left: i * w, behavior: "smooth" });
  }

  const future = sel > today;
  const { md, dow } = dayLabel(sel);
  // 내 카드는 항상 맨 앞. 아직 안 썼고 지금 쓸 수 있는 날이면 '쓰러 가기' 카드를 맨 앞에 둔다
  const mineCard = cards?.find((c) => c.mine);
  const others = cards?.filter((c) => !c.mine) ?? [];
  const slides: (BoardCard | "prompt")[] = mineCard
    ? [mineCard, ...others]
    : canEditDate(today, sel) ? ["prompt", ...others] : others;

  return (
    <div className="stack" style={{ gap: 16 }}>
      <div style={{ paddingTop: 4 }}>
        <h2>💌 감사 게시판</h2>
        <p className="muted small" style={{ margin: "4px 0 0" }}>옆으로 넘기며 서로의 감사를 나눠요.</p>
      </div>

      <DayTabs
        today={today} sel={sel} onSel={setSel}
        dim={(d) => d > today && !people[d]}
        sub={(d) => <span className="people">{people[d] ? `${people[d]}명` : "·"}</span>}
      />

      {!future && cards && (
        <PeopleButton
          date={sel} today={today} cards={cards}
          onPick={(name) => {
            const i = slides.findIndex((c) => c !== "prompt" && c.nickname === name);
            if (i >= 0) go(i);
          }}
        />
      )}

      {future ? (
        <div className="card muted" style={{ textAlign: "center" }}>🔒 {md}({dow})은 아직 열리지 않았어요</div>
      ) : cards === null ? (
        <p className="muted" style={{ textAlign: "center" }}>불러오는 중…</p>
      ) : slides.length === 0 ? (
        <div className="card muted" style={{ textAlign: "center" }}>{md}({dow})에는 아직 감사가 없어요</div>
      ) : (
        <>
          <div className="swipe" ref={trackRef}>
            {slides.map((c, i) =>
              c === "prompt" ? (
                <div key="prompt" className="swipe-card prompt-card">
                  <b className="card-name">나</b>
                  <div className="prompt-body">
                    <p>아직 {md}({dow})의 감사를 쓰지 않았어요</p>
                    <button className="btn" onClick={() => goWrite(sel)}>✍️ 감사 쓰러 가기</button>
                  </div>
                  <span className="page-no">{i + 1} / {slides.length}</span>
                </div>
              ) : (
                <div key={i} className={`swipe-card tone-${i % 4}`}>
                  <div className="spread">
                    <b className="card-name">{c.nickname}</b>
                    {c.mine ? <span className="badge brand">나</span> : <span className="muted small">{md} ({dow}){WEEKEND.includes(sel) && " ✨"}</span>}
                  </div>
                  <ol>
                    {c.entries.map((t, k) => <li key={k}>{t}</li>)}
                  </ol>
                  <div className="card-foot">
                    <button className="comment-btn" onClick={() => setCommentFor(c)}>
                      💬 댓글 {c.comments}
                    </button>
                    <span className="page-no">{i + 1} / {slides.length}</span>
                  </div>
                </div>
              ),
            )}
          </div>
        </>
      )}

      {commentFor && (
        <Comments
          card={commentFor} date={sel} say={say}
          onClose={(n) => {
            setCards((cs) => cs?.map((c) => (c.userId === commentFor.userId ? { ...c, comments: n } : c)) ?? null);
            setCommentFor(null);
          }}
        />
      )}
    </div>
  );
}

/**
 * 게이지 위치(%). 열매 단계(0·4·7·10·13개)가 막대 위에 같은 간격으로 놓이도록
 * 단계 사이를 구간별로 늘려서 계산한다. 15개면 100%.
 */
function gaugePos(count: number) {
  const mins = TIERS.map((t) => t.min); // [0, 4, 7, 10, 13]
  const step = 88 / (mins.length - 1); // 단계 사이 간격 22%
  for (let i = mins.length - 1; i >= 0; i--) {
    if (count >= mins[i]) {
      const nextMin = mins[i + 1] ?? MAX_COUNT;
      const span = i === mins.length - 1 ? 100 - 88 : step;
      return Math.min(100, i * step + ((count - mins[i]) / (nextMin - mins[i])) * span);
    }
  }
  return 0;
}

/** 내 열매 바꾸기. 이미 바구니에 넣었다면 넣은 열매는 빠진다(다시 넣어야 함). */
async function changeFruit(f: FruitId, placed: boolean, after: () => Promise<void>, say: (m: string) => void) {
  if (placed && !confirm("열매를 바꾸면 바구니에 넣은 열매가 빠져요. 바꾼 뒤 다시 넣어주세요. 바꿀까요?")) return;
  try {
    await api("/api/me", { method: "POST", body: { fruit: f } });
    await after();
    if (placed) say("바구니에서 열매를 뺐어요. 새 열매를 다시 넣어주세요!");
  } catch (e) { say((e as Error).message); }
}

/** 단계별 대표 열매 (게이지·첫 화면) */
const REP_FRUITS: FruitId[] = ["chestnut", "fig", "apple", "mango", "watermelon"];

/** 열매 도감 / 고르기: 단계별 3종, 해금 안 된 건 잠겨 보인다. onPick이 있으면 고르기 모드 */
function FruitBook({ count, golden, value, onPick, onClose }: {
  count: number; golden: boolean; value?: FruitId; onPick?: (f: FruitId) => void; onClose: () => void;
}) {
  const open = unlockedFruits(count);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="spread" style={{ marginBottom: 4 }}>
          <b>{onPick ? "🧺 바구니에 넣을 열매 고르기" : "📖 열매 도감"}</b>
        </div>
        <p className="muted small" style={{ margin: "0 0 10px" }}>
          {open.length}/{ALL_FRUITS.length}종 해금 · 감사를 많이 쓸수록 더 큰 열매가 열려요
        </p>
        <div className="book">
          {TIERS.map((t) => {
            const unlocked = count >= t.min;
            return (
              <div key={t.level} className={`book-tier ${unlocked ? "" : "locked"}`}>
                <div className="book-head">
                  <b>{t.level}단계</b>
                  <span className="muted small">{unlocked ? "해금" : `🔒 ${t.min}개부터 열려요`}</span>
                </div>
                <div className="book-fruits">
                  {t.fruits.map((f) => (
                    <button
                      key={f} disabled={!unlocked || !onPick}
                      className={`book-fruit ${value === f ? "on" : ""}`}
                      onClick={() => { onPick?.(f); onClose(); }}
                    >
                      {unlocked ? <Fruit id={f} size={38} /> : <span className="mystery" style={{ width: 38, height: 38 }}>?</span>}
                      <span>{unlocked ? FRUIT_NAMES[f] : "???"}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ───────────── 게시판 댓글 ───────────── */

type CommentRow = { id: number; nickname: string; content: string; mine: boolean };

function Comments({ card, date, say, onClose }: {
  card: BoardCard; date: string; say: (m: string) => void; onClose: (count: number) => void;
}) {
  const [list, setList] = useState<CommentRow[] | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const { md, dow } = dayLabel(date);

  useEffect(() => {
    api<{ comments: CommentRow[] }>(`/api/comments?target=${card.userId}&date=${date}`)
      .then((r) => setList(r.comments)).catch((e) => say((e as Error).message));
  }, [card.userId, date, say]);

  useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight }); }, [list]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    setBusy(true);
    try {
      const r = await api<{ comments: CommentRow[] }>("/api/comments", { method: "POST", body: { target: card.userId, date, content: draft } });
      setList(r.comments);
      setDraft("");
    } catch (err) { say((err as Error).message); }
    setBusy(false);
  }

  async function remove(id: number) {
    if (!confirm("이 댓글을 지울까요?")) return;
    try {
      await api(`/api/comments/${id}`, { method: "DELETE" });
      setList((l) => l?.filter((c) => c.id !== id) ?? null);
    } catch (err) { say((err as Error).message); }
  }

  const close = () => onClose(list?.length ?? card.comments);

  return (
    <div className="modal-backdrop" onClick={close}>
      <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="spread" style={{ marginBottom: 10 }}>
          <b>💬 {card.nickname}님의 {md}({dow}) 감사</b>
        </div>
        <div className="comment-list" ref={listRef}>
          {list === null ? (
            <p className="muted small" style={{ margin: 0, textAlign: "center" }}>불러오는 중…</p>
          ) : list.length === 0 ? (
            <p className="muted small" style={{ margin: 0, textAlign: "center" }}>첫 댓글을 남겨 응원해주세요!</p>
          ) : (
            list.map((c) => (
              <div key={c.id} className="comment">
                <div className="spread">
                  <b>{c.nickname}{c.mine && <span className="badge brand" style={{ marginLeft: 6 }}>나</span>}</b>
                  {c.mine && <button className="link danger" style={{ padding: 0 }} onClick={() => remove(c.id)}>삭제</button>}
                </div>
                <p>{c.content}</p>
              </div>
            ))
          )}
        </div>
        <form className="comment-form" onSubmit={send}>
          <input
            className="input" value={draft} maxLength={COMMENT_LEN} placeholder="따뜻한 한마디를 남겨주세요"
            onChange={(e) => setDraft(e.target.value)}
          />
          <button className="btn" disabled={busy || !draft.trim()}>등록</button>
        </form>
      </div>
    </div>
  );
}

/* ───────────── 그날 감사 남긴 사람 (게시판) ───────────── */

function PeopleButton({ date, today, cards, onPick }: {
  date: string; today: string; cards: BoardCard[]; onPick: (nickname: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const { md, dow } = dayLabel(date);
  const when = date === today ? "오늘" : `${md}(${dow})에`;

  return (
    <>
      <button className="today-pill" onClick={() => setOpen(true)} disabled={cards.length === 0}>
        <span>👥</span>
        <span className="grow">
          {cards.length === 0
            ? "아직 아무도 참여하지 않았어요"
            : <>{when} <b>{cards.length}명</b>이 감사를 남겨주었어요</>}
        </span>
        {cards.length > 0 && <span className="muted">›</span>}
      </button>

      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="spread" style={{ marginBottom: 12 }}>
              <b>{md}({dow}) 감사를 남긴 사람 {cards.length}명</b>
            </div>
            <div className="sheet-list">
              {cards.map((c) => (
                <button
                  key={c.nickname}
                  className={`sheet-row ${c.entries.length >= PER_DAY ? "full" : ""}`}
                  onClick={() => { setOpen(false); onPick(c.nickname); }}
                >
                  <span className="grow">{c.nickname}{c.mine && <span className="badge brand" style={{ marginLeft: 6 }}>나</span>}</span>
                  <span className="dots">
                    {Array.from({ length: PER_DAY }, (_, i) => <i key={i} className={i < c.entries.length ? "on" : ""} />)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ───────────── 날짜 탭 (내 감사·게시판 공용) ───────────── */

function defaultDay(today: string) {
  return DAYS.includes(today) ? today : today < DAYS[0] ? DAYS[0] : DAYS[DAYS.length - 1];
}

function DayTabs({ today, sel, onSel, dim, sub }: {
  today: string; sel: string; onSel: (d: string) => void;
  dim: (d: string) => boolean; sub: (d: string) => React.ReactNode;
}) {
  return (
    <div className="day-tabs">
      {DAYS.map((d) => {
        const { md, dow } = dayLabel(d);
        return (
          <button
            key={d}
            className={`${d === sel ? "on" : ""} ${dim(d) ? "locked" : ""} ${d === today ? "today" : ""}`}
            onClick={() => onSel(d)}
          >
            <span className="dow">{dow}{WEEKEND.includes(d) && "✨"}</span>
            <span className="md">{md}</span>
            {sub(d)}
          </button>
        );
      })}
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

// 넣은 사람 수만큼 과일이 하나씩 쌓이고(최대 15개), 그 뒤로는 가득 찬 바구니의 구성만 바뀐다.
type Piece = { fruit: FruitId; golden: boolean; mine: boolean; left: number; bottom: number; size: number; rotate: number; z: number };

// 봉긋한 더미: 줄마다 반 칸씩 엇갈리고, 가운데로 갈수록 살짝 솟는다(curve).
// 앞줄은 바구니 테두리 뒤로 깊이 잠기게(base 음수) 해서 과일이 바구니에 담긴 느낌을 준다.
const ROW_SPEC = [
  { cap: 7, base: -7, curve: 5, spacing: 13.5, size: 29, z: 3 }, // 앞줄
  { cap: 6, base: 10, curve: 8, spacing: 13.5, size: 28, z: 2 }, // 가운데
  { cap: 4, base: 26, curve: 7, spacing: 14.5, size: 27, z: 1 }, // 맨 위
];

/** 이 인원까지는 실제로 넣은 과일 그대로 보여준다 */
const LIVE_LIMIT = 10;
/** 11명부터 보여줄 고정 그림: 줄마다 왼쪽→오른쪽으로 직접 배치 (앞줄 7 · 가운데 6 · 뒷줄 4) */
const FULL_LAYOUT: FruitId[][] = [
  ["chestnut", "chestnut", "olive", "olive", "tangerine", "fig", "fig"],
  ["persimmon", "persimmon", "tangerine", "tangerine", "apple", "apple"],
  ["watermelon", "mango", "mango", "apple"],
];

// 단계가 높을수록(큰 열매일수록) 크게 그린다
const TIER_SCALE = [0, 0.8, 0.86, 0.94, 1.0, 1.08];
/** 올리브는 가지 그림이라 위로 떠 보여서 조금 내려 앉힌다 */
const NUDGE = (f: FruitId) => (f === "olive" ? -2 : 0);
/** 올리브는 알이 작아서 그림을 조금 키운다 */
const EXTRA = (f: FruitId) => (f === "olive" ? 1.2 : 1);

function rowSlots(k: number, rowIdx: number, seedBase: number) {
  const row = ROW_SPEC[rowIdx];
  const half = Math.max((k - 1) / 2, 1);
  return Array.from({ length: k }, (_, j) => {
    const r = Math.sin((seedBase + j + 1) * 12.9898) * 43758.5453;
    const rand = r - Math.floor(r);
    const off = j - (k - 1) / 2;
    return {
      left: 50 + off * row.spacing + (rand - 0.5) * 2,
      bottom: row.base + row.curve * (1 - (off / half) ** 2) + (rand - 0.5) * 2,
      size: row.size,
      rotate: (rand - 0.5) * 20,
      z: row.z * 10 + Math.round(10 - Math.abs(off) * 2),
    };
  });
}

/** 작은 열매(1·2단계) 무리는 가운데로 끌어당겨 옹기종기 모은다 (1단계는 더 촘촘히) */
function huddle(pieces: Piece[]) {
  for (const t of new Set(pieces.map((p) => p.fruit))) {
    const lv = tierOf(t).level;
    if (lv > 2) continue;
    const g = pieces.filter((p) => p.fruit === t);
    if (g.length < 2) continue;
    const k = lv === 1 ? 0.78 : 0.85;
    const cx = g.reduce((s, p) => s + p.left, 0) / g.length;
    const cb = g.reduce((s, p) => s + p.bottom, 0) / g.length;
    g.forEach((p) => { p.left = cx + (p.left - cx) * k; p.bottom = cb + (p.bottom - cb) * k; });
  }
  return pieces;
}

/** 고정 그림 (FULL_LAYOUT 그대로) */
function fixedBasket(): Piece[] {
  let seed = 0;
  return huddle(FULL_LAYOUT.flatMap((row, ri) => {
    const sl = rowSlots(row.length, ri, seed);
    seed += row.length;
    return row.map((fruit, j) => {
      const size = sl[j].size * TIER_SCALE[tierOf(fruit).level] * EXTRA(fruit);
      return { fruit, golden: false, mine: false, ...sl[j], size, bottom: sl[j].bottom + (sl[j].size - size) * 0.9 + NUDGE(fruit) };
    });
  })).map((p) => (p.fruit === "olive" ? { ...p, left: p.left - 5 } : p)); // 올리브는 밤 쪽으로 조금 더
}

function arrangeFruits(placed: BasketData["placed"]): Piece[] {
  // 10명까지는 실제로 넣은 과일을 그대로 하나씩 그린다 (한 종류 최대 3개).
  // 11명부터는 미리 짜둔 '가득 찬 바구니' 그림으로 고정한다.
  const PER_TYPE = 3;
  if (placed.length > LIVE_LIMIT) return fixedBasket();
  const shown = ALL_FRUITS.map((f) => Math.min(PER_TYPE, placed.filter((p) => p.fruit === f).length));
  const items: Omit<Piece, "left" | "bottom" | "size" | "rotate" | "z">[] = [];
  ALL_FRUITS.forEach((f, i) => {
    for (let k = 0; k < shown[i]; k++) {
      // 바구니 그림에는 황금을 그리지 않는다 (넣을 때 애니메이션으로만)
      items.push({ fruit: f, golden: false, mine: false });
    }
  });
  // 앞줄부터 자리를 만든다
  const slots: Omit<Piece, "fruit" | "golden" | "mine">[] = [];
  let left = items.length;
  for (const row of ROW_SPEC) {
    const k = Math.min(row.cap, left);
    left -= k;
    const half = Math.max((k - 1) / 2, 1);
    for (let j = 0; j < k; j++) {
      const r = Math.sin((slots.length + 1) * 12.9898) * 43758.5453;
      const rand = r - Math.floor(r);
      const off = j - (k - 1) / 2;
      slots.push({
        left: 50 + off * row.spacing + (rand - 0.5) * 2,
        bottom: row.base + row.curve * (1 - (off / half) ** 2) + (rand - 0.5) * 2,
        size: row.size,
        rotate: (rand - 0.5) * 20,
        z: row.z * 10 + Math.round(10 - Math.abs(off) * 2),
      });
    }
  }
  // 작은 열매는 앞줄, 큰 열매는 뒷줄로. 같은 과일은 한 무리로 이어 붙인다.
  // 자리 순서: 앞줄 왼→오, 가운데 줄 오→왼, 뒷줄 왼→오 (지그재그라 줄이 바뀌어도 무리가 끊기지 않음)
  const rowOf = (i: number) => (slots[i].z >= 30 ? 0 : slots[i].z >= 20 ? 1 : 2);
  const order = slots.map((_, i) => i).sort((x, y) => {
    const rx = rowOf(x), ry = rowOf(y);
    if (rx !== ry) return rx - ry;
    // 맨 뒷줄은 바깥→가운데 순: 가장 큰 열매(마지막)가 뒤쪽 한가운데에 오도록
    if (rx === 2) return Math.abs(slots[y].left - 50) - Math.abs(slots[x].left - 50);
    return rx % 2 === 0 ? slots[x].left - slots[y].left : slots[y].left - slots[x].left;
  });
  const types = [...new Set(items.map((it) => it.fruit))].sort(
    (x, y) => tierOf(x).level - tierOf(y).level || items.filter((i) => i.fruit === y).length - items.filter((i) => i.fruit === x).length,
  );
  const queue = types.flatMap((t) => items.filter((it) => it.fruit === t));
  const pieces = queue.map((it, k) => {
    const sl = slots[order[k]];
    const size = sl.size * TIER_SCALE[tierOf(it.fruit).level] * EXTRA(it.fruit);
    // 작은 과일은 바구니에 너무 파묻히지 않게 줄어든 만큼 살짝 올린다
    return { ...it, ...sl, size, bottom: sl.bottom + (sl.size - size) * 0.9 + NUDGE(it.fruit) };
  });
  return huddle(pieces);
}

function Basket({ me, reload, say }: { me: Me; reload: () => Promise<void>; say: (m: string) => void }) {
  const [data, setData] = useState<BasketData | null>(null);
  const [dropping, setDropping] = useState<{ fruit: FruitId; golden: boolean } | null>(null);
  // 바구니에 넣을 열매: 기본은 가장 높은 단계의 첫 열매
  const pick = me.user.fruit;
  const setPick = (f: FruitId) => changeFruit(f, me.user.placed, async () => { await Promise.all([reload(), fetchBasket()]); }, say);
  const [picking, setPicking] = useState(false);
  const [landed, setLanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  // 바구니 탭을 열 때마다 숲속 나뭇잎을 헤치고 들어가는 연출
  const [intro, setIntro] = useState(true);
  const endIntro = useCallback(() => setIntro(false), []);
  const introEl = intro ? <ForestIntro onDone={endIntro} /> : null;

  const fetchBasket = useCallback(async () => {
    try { setData(await api<BasketData>("/api/basket")); } catch (e) { say((e as Error).message); }
  }, [say]);
  useEffect(() => { fetchBasket(); }, [fetchBasket]);

  async function place() {
    setBusy(true);
    try {
      await api("/api/basket", { method: "POST", body: { fruit: pick } });
      // 내 열매가 위에서 떨어져 바구니에 쏙 들어간다
      setDropping({ fruit: pick, golden: me.user.golden });
      await new Promise((r) => setTimeout(r, 1300)); // 열매가 위에서 떨어져 바구니에 쏙 들어간 뒤
      await Promise.all([fetchBasket(), reload()]);
      setDropping(null);
      setLanded(true);
      setTimeout(() => setLanded(false), 900);
    } catch (e) { say((e as Error).message); }
    setBusy(false);
  }

  if (!data) return <>{introEl}<p className="muted" style={{ textAlign: "center", paddingTop: 40 }}>바구니 가져오는 중…</p></>;

  const { user } = me;
  const myFruit = user.placed ? user.fruit : pick;
  const pieces = arrangeFruits(data.placed);

  return (
    <div className="forest-page">
      {introEl}
      <ForestBackdrop />
      {picking && (
        <FruitBook count={user.count} golden={user.golden} value={pick} onPick={setPick} onClose={() => setPicking(false)} />
      )}
      <div className="forest-content">
        <div className="forest-head">
          <h2>🎤 싱어팀 감사 바구니</h2>
          <div className="pills">
            <span className="total-pill">
              {data.open ? <>🧺 바구니에 넣은 사람 <b>{data.placed.length}명</b></> : <>🧺 바구니는 <b>10/24(토)</b>에 열려요</>}
            </span>
            <span className="total-pill">🙏 한 주간 모인 감사 <b>{data.totalThanks}개</b></span>
          </div>
        </div>

        <div className="forest-spacer" />

        <div className="stage-wrap">
        <svg className="meadow" viewBox="0 0 400 100" preserveAspectRatio="none" aria-hidden>
          <path d="M0 22 C 110 2 290 2 400 22 L400 100 L0 100 Z" fill="#a8cf86" />
          <path d="M0 64 C 120 52 280 52 400 64 L400 100 L0 100 Z" fill="#9ac57b" />
        </svg>
        <div className="basket-stage" ref={stageRef}>
          <BasketBack />
          <div className={`pile ${landed ? "landed" : ""}`}>
            {pieces.map((p, i) => (
              <div
                key={i}
                className="p"
                style={{ left: `${p.left}%`, bottom: `${p.bottom}%`, width: `${p.size}%`, zIndex: p.z }}
              >
                <div style={{ transform: `rotate(${p.rotate}deg)` }}>
                  <Fruit id={p.fruit} golden={p.golden} size="100%" />
                </div>
              </div>
            ))}
          </div>
          {dropping && (
            <div className="dropper">
              <Fruit id={dropping.fruit} golden={dropping.golden} size="100%" />
            </div>
          )}
          <BasketFront />
          {landed && (
            <div className="burst" aria-hidden>
              <span>✨</span><span>✨</span><span>✨</span>
            </div>
          )}
        </div>
        </div>

        <div className="forest-ground">
          {!data.open ? (
            <div className="ground-card">
              <div style={{ flex: 1 }}>
                <b>바구니는 아직 비어 있어요</b>
                <p className="muted small">토요일(10/24)에 한 주간 모은 열매를 다 함께 담아요!</p>
              </div>
            </div>
          ) : user.placed ? (
            <div className="ground-card">
              <button className="card-fruit pickable" onClick={() => setPicking(true)} aria-label="열매 바꾸기">
                <Fruit id={myFruit} golden={user.golden} size="100%" />
                <span className="swap">⇄</span>
              </button>
              <div style={{ flex: 1 }}>
                <b>나는 {user.golden ? "황금 " : ""}{josa(FRUIT_NAMES[myFruit], "을", "를")} 넣었어요!</b>
                <p className="muted small">{user.golden ? "토요일 감사로 황금 열매가 되었어요 ✨" : "함께 채운 바구니예요 🙏"}</p>
              </div>
            </div>
          ) : (
            <div className="ground-card">
              <button className="card-fruit pickable" onClick={() => setPicking(true)} disabled={!!dropping} aria-label="열매 고르기">
                <Fruit id={myFruit} golden={user.golden} size="100%" />
                <span className="swap">⇄</span>
              </button>
              <button className="pick-text" onClick={() => setPicking(true)} disabled={!!dropping}>
                <b>내 열매: {user.golden ? "황금 " : ""}{FRUIT_NAMES[myFruit]}</b>
              </button>
              <button className="btn" disabled={busy || !!dropping} onClick={place}>넣기</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Wheat({ x, y, angle, flip = false }: { x: number; y: number; angle: number; flip?: boolean }) {
  const grains = [0, 1, 2, 3, 4, 5];
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle}) ${flip ? "scale(-1 1)" : ""}`}>
      <path d="M0 0 C2 -40 6 -80 14 -118" stroke="#b5834a" strokeWidth="3" fill="none" strokeLinecap="round" />
      {grains.map((g) => {
        const t = 30 + g * 15;
        const cx = (t / 118) * 12;
        return (
          <g key={g}>
            <ellipse cx={cx - 8} cy={-t} rx="5" ry="9.5" fill="#c99a5e" transform={`rotate(-35 ${cx - 8} ${-t})`} />
            <ellipse cx={cx + 9} cy={-t - 4} rx="5" ry="9.5" fill="#b9884d" transform={`rotate(35 ${cx + 9} ${-t - 4})`} />
          </g>
        );
      })}
      <ellipse cx="14" cy="-126" rx="4.5" ry="9" fill="#c99a5e" />
    </g>
  );
}

/** 바구니 탭 전체 배경: 하늘·햇살·먼 나무·가까운 나무·떨어지는 단풍 (아래쪽은 풀밭이 덮는다) */
function ForestBackdrop() {
  const far = [
    [10, 470, 34], [60, 462, 38], [112, 472, 32], [160, 458, 40], [210, 468, 34],
    [258, 456, 40], [306, 470, 34], [352, 460, 38], [398, 468, 36],
  ];
  const mid = [[40, 400, 52], [104, 428, 40], [300, 424, 42], [364, 392, 54]];
  const falling = [
    { x: 110, y: 220, c: "#e0a12a", r: 30, d: "0s" },
    { x: 270, y: 280, c: "#d9772a", r: -40, d: "-2.2s" },
    { x: 190, y: 160, c: "#8cc152", r: 70, d: "-4.1s" },
    { x: 330, y: 200, c: "#e0a12a", r: -10, d: "-1.3s" },
    { x: 60, y: 300, c: "#d9772a", r: 50, d: "-5.4s" },
  ];
  return (
    <svg className="forest-bg" viewBox="0 0 400 800" preserveAspectRatio="xMidYMax slice" aria-hidden>
      <defs>
        <linearGradient id="fs-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fbefcf" />
          <stop offset=".6" stopColor="#eef3d8" />
          <stop offset="1" stopColor="#dfeccb" />
        </linearGradient>
        <radialGradient id="fs-sun" cx="0.75" cy="0.08" r="0.6">
          <stop offset="0" stopColor="#fff2b8" stopOpacity="1" />
          <stop offset="1" stopColor="#fff2b8" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="800" fill="url(#fs-sky)" />
      <rect width="400" height="800" fill="url(#fs-sun)" />
      <g fill="#fff" opacity=".2">
        <path d="M290 0 L340 0 L200 520 L150 520 Z" />
        <path d="M356 0 L380 0 L262 520 L236 520 Z" />
      </g>
      {/* 먼 나무 */}
      <g fill="#bcd5a8">
        {far.map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} />)}
        <rect x="0" y="470" width="400" height="330" />
      </g>
      {/* 가운데 나무 */}
      {mid.map(([x, y, r], i) => (
        <g key={i}>
          <rect x={x - 4} y={y} width="8" height={800 - y} fill="#9b8462" />
          <circle cx={x} cy={y} r={r} fill="#93c07e" />
          <circle cx={x - r * 0.35} cy={y - r * 0.3} r={r * 0.55} fill="#a6cc8f" />
        </g>
      ))}
      {/* 가까운 나무: 양옆에서 감싸기 */}
      <rect x="4" y="180" width="22" height="620" fill="#7a5a3a" />
      <circle cx="0" cy="150" r="96" fill="#5f9a55" />
      <circle cx="58" cy="96" r="52" fill="#6fab60" />
      <circle cx="30" cy="250" r="44" fill="#5f9a55" />
      <rect x="374" y="200" width="22" height="600" fill="#7a5a3a" />
      <circle cx="400" cy="170" r="92" fill="#5f9a55" />
      <circle cx="346" cy="112" r="48" fill="#6fab60" />
      <circle cx="372" cy="270" r="40" fill="#5f9a55" />
      {falling.map((f, i) => (
        <g key={i} className="fall-leaf" style={{ animationDelay: f.d }}>
          <path transform={`translate(${f.x} ${f.y}) rotate(${f.r}) scale(.2)`} d="M0 0 C 14 -26 50 -30 78 0 C 50 30 14 26 0 0 Z" fill={f.c} />
        </g>
      ))}
    </svg>
  );
}

function BasketBack() {
  return (
    <svg className="basket" viewBox="0 30 400 290" aria-hidden>
      <ellipse cx="200" cy="296" rx="150" ry="10" fill="#4f7d3b" opacity=".35" />
      <Wheat x={70} y={206} angle={-28} />
      <Wheat x={92} y={206} angle={-10} />
      <Wheat x={330} y={206} angle={26} flip />
    </svg>
  );
}

function BasketFront() {
  const marks: { x: number; y: number }[] = [];
  [238, 262].forEach((y, r) => {
    for (let x = 72 + (r % 2) * 20; x <= 330; x += 40) marks.push({ x, y });
  });
  return (
    <svg className="basket basket-front" viewBox="0 30 400 290" aria-hidden>
      <defs>
        <clipPath id="bk-clip">
          <path d="M42 214 L358 214 C354 252 316 288 200 288 C84 288 46 252 42 214 Z" />
        </clipPath>
      </defs>
      <g clipPath="url(#bk-clip)">
        <rect x="0" y="200" width="400" height="140" fill="#dcb987" />
        <path d="M290 214 L400 214 L400 300 L260 300 C320 276 330 244 290 214 Z" fill="#cfa974" />
        {marks.map((m, i) => (
          <g key={i} stroke="#b08550" strokeWidth="5" strokeLinecap="round">
            <line x1={m.x - 11} y1={m.y - 6} x2={m.x - 4} y2={m.y + 6} />
            <line x1={m.x + 4} y1={m.y + 6} x2={m.x + 11} y2={m.y - 6} />
          </g>
        ))}
      </g>
      <rect x="26" y="196" width="348" height="26" rx="13" fill="#b08550" />
      <rect x="34" y="200" width="332" height="5" rx="2.5" fill="#c49a66" />
    </svg>
  );
}
