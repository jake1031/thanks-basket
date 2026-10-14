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
create table if not exists basket (
  user_id int primary key references users(id) on delete cascade,
  placed_at timestamptz not null default now()
);
`;

declare global {
  // eslint-disable-next-line no-var
  var __thanksDb: Promise<QueryFn> | undefined;
}

async function connect(): Promise<QueryFn> {
  const url = process.env.DATABASE_URL;
  let query: QueryFn;

  if (url) {
    const postgres = (await import("postgres")).default;
    const sql = postgres(url, { prepare: false, max: 3, idle_timeout: 20 });
    query = async (text, params = []) => (await sql.unsafe(text, params as any[])) as any;
    for (const stmt of SCHEMA.split(";").map((s) => s.trim()).filter(Boolean)) {
      await sql.unsafe(stmt);
    }
  } else {
    // 로컬 개발용 내장 Postgres
    const { PGlite } = await import("@electric-sql/pglite");
    const pg = new PGlite("./.pglite");
    await pg.exec(SCHEMA);
    query = async (text, params = []) => (await pg.query(text, params as any[])).rows as any;
  }
  return query;
}

export const db: QueryFn = async (text, params) => {
  globalThis.__thanksDb ??= connect().catch((e) => {
    globalThis.__thanksDb = undefined;
    throw e;
  });
  const q = await globalThis.__thanksDb;
  return q(text, params);
};
