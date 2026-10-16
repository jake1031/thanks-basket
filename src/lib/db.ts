import "server-only";

type Row = Record<string, any>;
type QueryFn = <T extends Row = Row>(text: string, params?: unknown[]) => Promise<T[]>;

const SCHEMA = `
create table if not exists users (
  id serial primary key,
  nickname text not null unique,
  pin_hash text not null,
  failed_count int not null default 0,
  locked_until timestamptz,
  created_at timestamptz not null default now()
);
create table if not exists sessions (
  token_hash text primary key,
  user_id int not null references users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create table if not exists entries (
  id serial primary key,
  user_id int not null references users(id) on delete cascade,
  entry_date date not null,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists entries_user_date on entries(user_id, entry_date);
alter table users add column if not exists real_name text not null default '';
create table if not exists comments (
  id serial primary key,
  target_user_id int not null references users(id) on delete cascade,
  entry_date date not null,
  author_id int not null references users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);
create index if not exists comments_target on comments(target_user_id, entry_date);
create table if not exists basket (
  user_id int primary key references users(id) on delete cascade,
  placed_at timestamptz not null default now()
);
alter table basket add column if not exists fruit text
`;

declare global {
  // eslint-disable-next-line no-var
  var __thanksDb: Promise<QueryFn> | undefined;
  // eslint-disable-next-line no-var
  var __thanksSchema: Promise<void> | undefined;
  // eslint-disable-next-line no-var
  var __thanksSchemaText: string | undefined;
}

async function connect(): Promise<QueryFn> {
  const url = process.env.DATABASE_URL;
  if (url) {
    const postgres = (await import("postgres")).default;
    const sql = postgres(url, { prepare: false, max: 3, idle_timeout: 20 });
    return async (text, params = []) => (await sql.unsafe(text, params as any[])) as any;
  }
  // 로컬 개발용 내장 Postgres
  const { PGlite } = await import("@electric-sql/pglite");
  const pg = new PGlite(process.env.PGLITE_DIR || "./.pglite");
  return async (text, params = []) => (await pg.query(text, params as any[])).rows as any;
}

/** 테이블 준비. 개발 중 SCHEMA가 바뀌면 다시 적용한다 (모두 'if not exists'라 여러 번 실행해도 안전). */
async function ensureSchema(q: QueryFn) {
  for (const stmt of SCHEMA.split(";").map((s) => s.trim()).filter(Boolean)) await q(stmt);
}

export const db: QueryFn = async (text, params) => {
  globalThis.__thanksDb ??= connect().catch((e) => {
    globalThis.__thanksDb = undefined;
    throw e;
  });
  const q = await globalThis.__thanksDb;
  if (globalThis.__thanksSchemaText !== SCHEMA) {
    globalThis.__thanksSchemaText = SCHEMA;
    globalThis.__thanksSchema = ensureSchema(q).catch((e) => {
      globalThis.__thanksSchemaText = undefined;
      throw e;
    });
  }
  await globalThis.__thanksSchema;
  return q(text, params);
};
