-- FinAlly: Supabase schema for authenticated paper trading.
-- This application uses real market-data quotes but ONLY executes simulated, virtual-cash trades.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.paper_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  virtual_cash numeric(18,2) not null default 10000.00 check (virtual_cash >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.watchlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  symbol text not null check (symbol ~ '^[A-Z][A-Z0-9.-]{0,9}$'),
  created_at timestamptz not null default now(),
  unique (user_id, symbol)
);

create table if not exists public.paper_positions (
  user_id uuid not null references auth.users(id) on delete cascade,
  symbol text not null check (symbol ~ '^[A-Z][A-Z0-9.-]{0,9}$'),
  quantity numeric(18,6) not null check (quantity >= 0),
  average_price numeric(18,6) not null check (average_price > 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, symbol)
);

create table if not exists public.paper_trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  symbol text not null check (symbol ~ '^[A-Z][A-Z0-9.-]{0,9}$'),
  side text not null check (side in ('buy', 'sell')),
  quantity numeric(18,6) not null check (quantity > 0),
  price numeric(18,6) not null check (price > 0),
  notional numeric(18,2) not null check (notional > 0),
  created_at timestamptz not null default now()
);

create index if not exists watchlist_user_idx on public.watchlist(user_id);
create index if not exists paper_trades_user_created_idx on public.paper_trades(user_id, created_at desc);
create index if not exists paper_positions_user_idx on public.paper_positions(user_id);

-- New users always receive an ordinary user role and a $10,000 virtual balance.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, coalesce(new.email, ''), nullif(new.raw_user_meta_data ->> 'full_name', ''), 'user')
  on conflict (id) do update set email = excluded.email;

  insert into public.paper_accounts (user_id, virtual_cash)
  values (new.id, 10000.00)
  on conflict (user_id) do nothing;

  insert into public.watchlist (user_id, symbol)
  values
    (new.id, 'AAPL'), (new.id, 'MSFT'), (new.id, 'NVDA'), (new.id, 'GOOGL'), (new.id, 'TSLA')
  on conflict (user_id, symbol) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_finallly on auth.users;
create trigger on_auth_user_created_finallly
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Role-sensitive RLS. Application users cannot update their own role or account balance.
alter table public.profiles enable row level security;
alter table public.paper_accounts enable row level security;
alter table public.watchlist enable row level security;
alter table public.paper_positions enable row level security;
alter table public.paper_trades enable row level security;

revoke all on public.profiles from anon, authenticated;
revoke all on public.paper_accounts from anon, authenticated;
revoke all on public.watchlist from anon, authenticated;
revoke all on public.paper_positions from anon, authenticated;
revoke all on public.paper_trades from anon, authenticated;

grant select on public.profiles to authenticated;
grant select on public.paper_accounts to authenticated;
grant select, insert, delete on public.watchlist to authenticated;
grant select on public.paper_positions to authenticated;
grant select on public.paper_trades to authenticated;

create policy "profile owner may read profile" on public.profiles
for select to authenticated using ((select auth.uid()) = id);

create policy "account owner may read account" on public.paper_accounts
for select to authenticated using ((select auth.uid()) = user_id);

create policy "watchlist owner may read rows" on public.watchlist
for select to authenticated using ((select auth.uid()) = user_id);
create policy "watchlist owner may add rows" on public.watchlist
for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "watchlist owner may remove rows" on public.watchlist
for delete to authenticated using ((select auth.uid()) = user_id);

create policy "position owner may read rows" on public.paper_positions
for select to authenticated using ((select auth.uid()) = user_id);
create policy "trade owner may read rows" on public.paper_trades
for select to authenticated using ((select auth.uid()) = user_id);

-- Execute an atomic virtual-cash transaction. This function is the only write path for simulated trades.
drop function if exists public.execute_paper_trade(text, text, numeric, numeric);
drop function if exists public.execute_paper_trade(uuid, text, text, numeric, numeric);

create or replace function public.execute_paper_trade(
  p_user_id uuid,
  p_symbol text,
  p_side text,
  p_quantity numeric,
  p_price numeric
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := p_user_id;
  v_symbol text := upper(trim(p_symbol));
  v_cash numeric(18,2);
  v_position public.paper_positions%rowtype;
  v_notional numeric(18,2);
  v_new_qty numeric(18,6);
  v_new_avg numeric(18,6);
begin
  -- Callable only with the server-only service role. The app API independently verifies the signed-in user.
  if coalesce(auth.role(), '') <> 'service_role' then raise exception 'Use the authenticated application server'; end if;
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if v_symbol is null or v_symbol !~ '^[A-Z][A-Z0-9.-]{0,9}$' then raise exception 'Invalid symbol'; end if;
  if p_side is null or p_side not in ('buy', 'sell') then raise exception 'Side must be buy or sell'; end if;
  if p_quantity is null or p_quantity <= 0 or p_quantity > 100000 then raise exception 'Quantity must be positive and no greater than 100,000'; end if;
  if p_price is null or p_price <= 0 then raise exception 'Price must be positive'; end if;

  v_notional := round(p_quantity * p_price, 2);
  if v_notional < 0.01 then raise exception 'Trade notional must be at least $0.01'; end if;
  insert into public.paper_accounts (user_id, virtual_cash)
  values (v_user_id, 10000.00)
  on conflict (user_id) do nothing;

  select virtual_cash into v_cash
  from public.paper_accounts where user_id = v_user_id for update;

  if p_side = 'buy' then
    if v_notional > v_cash then raise exception 'Insufficient virtual cash'; end if;

    select * into v_position from public.paper_positions
    where user_id = v_user_id and symbol = v_symbol for update;

    if found then
      v_new_qty := v_position.quantity + p_quantity;
      v_new_avg := ((v_position.quantity * v_position.average_price) + (p_quantity * p_price)) / v_new_qty;
      update public.paper_positions set quantity = v_new_qty, average_price = v_new_avg, updated_at = now()
      where user_id = v_user_id and symbol = v_symbol;
    else
      insert into public.paper_positions(user_id, symbol, quantity, average_price)
      values (v_user_id, v_symbol, p_quantity, p_price);
    end if;
    update public.paper_accounts set virtual_cash = virtual_cash - v_notional, updated_at = now() where user_id = v_user_id;
  else
    select * into v_position from public.paper_positions
    where user_id = v_user_id and symbol = v_symbol for update;
    if not found or v_position.quantity < p_quantity then raise exception 'Not enough shares in your paper portfolio to sell'; end if;
    update public.paper_positions set quantity = quantity - p_quantity, updated_at = now()
    where user_id = v_user_id and symbol = v_symbol;
    delete from public.paper_positions where user_id = v_user_id and symbol = v_symbol and quantity <= 0;
    update public.paper_accounts set virtual_cash = virtual_cash + v_notional, updated_at = now() where user_id = v_user_id;
  end if;

  insert into public.paper_trades(user_id, symbol, side, quantity, price, notional)
  values (v_user_id, v_symbol, p_side, p_quantity, p_price, v_notional);

  select virtual_cash into v_cash from public.paper_accounts where user_id = v_user_id;
  return jsonb_build_object('success', true, 'symbol', v_symbol, 'side', p_side,
    'quantity', p_quantity, 'price', p_price, 'notional', v_notional, 'virtual_cash', v_cash);
end;
$$;

revoke all on function public.execute_paper_trade(uuid, text, text, numeric, numeric) from public, anon, authenticated;
grant execute on function public.execute_paper_trade(uuid, text, text, numeric, numeric) to service_role;
