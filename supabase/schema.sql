-- ════════════════════════════════════════════════════════════
-- BNBHack Multiplayer Arena  –  Supabase Schema
-- ════════════════════════════════════════════════════════════

-- 1. Profiles (wallet-based identity)
create table if not exists profiles (
  wallet       text primary key,            -- 0x… lowercase
  display_name text,
  avatar_url   text,
  created_at   timestamptz default now()
);

-- 2. Fighters (currently active arena participants)
create table if not exists fighters (
  wallet       text primary key references profiles(wallet) on delete cascade,
  model_name   text not null,
  model_color  text default '#f0b90b',
  model_json   jsonb not null,              -- full weight file (persisted so backend can reload)
  cash         double precision default 10000,
  bnb          double precision default 0,
  total_buys   int default 0,
  total_sells  int default 0,
  total_holds  int default 0,
  last_signal  text,
  active       boolean default true,
  joined_at    timestamptz default now()
);

-- 3. Trades (every virtual trade)
create table if not exists trades (
  id           bigint generated always as identity primary key,
  wallet       text not null references profiles(wallet) on delete cascade,
  model_name   text,
  trade_type   text not null check (trade_type in ('buy','sell')),
  price        double precision not null,
  amount       double precision not null,
  confidence   double precision,
  tick         int not null,
  created_at   timestamptz default now()
);

-- 4. Portfolio snapshots (value after each tick)
create table if not exists portfolio_snapshots (
  id           bigint generated always as identity primary key,
  wallet       text not null references profiles(wallet) on delete cascade,
  tick         int not null,
  value        double precision not null,
  created_at   timestamptz default now()
);

-- 5. Arena state (singleton — one row tracks global arena)
create table if not exists arena_state (
  id           int primary key default 1 check (id = 1),
  tick_count   int default 0,
  running      boolean default true,
  started_at   timestamptz default now(),
  current_price double precision
);

-- seed the singleton arena row
insert into arena_state (id) values (1) on conflict do nothing;

-- ── Indexes ──────────────────────────────────────────────────────
create index if not exists idx_trades_wallet on trades(wallet);
create index if not exists idx_trades_tick   on trades(tick);
create index if not exists idx_snapshots_wallet on portfolio_snapshots(wallet);
create index if not exists idx_snapshots_tick   on portfolio_snapshots(tick);

-- ── Row Level Security ──────────────────────────────────────────
-- Enable RLS but allow all reads (public leaderboard). Writes go through backend service key.
alter table profiles           enable row level security;
alter table fighters           enable row level security;
alter table trades             enable row level security;
alter table portfolio_snapshots enable row level security;
alter table arena_state        enable row level security;

-- Public read policies
create policy "public_read_profiles"  on profiles  for select using (true);
create policy "public_read_fighters"  on fighters  for select using (true);
create policy "public_read_trades"    on trades    for select using (true);
create policy "public_read_snapshots" on portfolio_snapshots for select using (true);
create policy "public_read_arena"     on arena_state for select using (true);

-- Service role (backend) can do everything — handled automatically by service_role key

-- ── Realtime ─────────────────────────────────────────────────────
-- Enable realtime on fighter / trade / arena_state tables
alter publication supabase_realtime add table fighters;
alter publication supabase_realtime add table trades;
alter publication supabase_realtime add table arena_state;
