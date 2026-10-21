create table public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  template_id text not null,
  title text not null,
  data jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.documents enable row level security;

create policy "Users can view their own documents"
  on public.documents for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their own documents"
  on public.documents for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own documents"
  on public.documents for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own documents"
  on public.documents for delete to authenticated
  using ((select auth.uid()) = user_id);

-- ===== Part 2: plans, profiles, quotas, sharing, e-signatures, billing, admin =====
create table public.plans (id text primary key, name text not null, monthly_docs int not null, price_usd int not null default 0);
insert into public.plans values ('free','Free',3,0),('pro','Pro',100,9),('business','Business',1000,29);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text, role text not null default 'user' check (role in ('user','admin')),
  plan text not null default 'free' references public.plans(id),
  stripe_customer_id text, stripe_subscription_id text, subscription_status text,
  created_at timestamptz not null default now());
insert into public.profiles(id,email) select id,email from auth.users on conflict do nothing;

create table public.invoices (id text primary key, user_id uuid not null references auth.users(id) on delete cascade,
  amount_paid int not null, currency text not null, status text, hosted_invoice_url text, created_at timestamptz not null default now());
create table public.webhook_events (id text primary key, created_at timestamptz not null default now());
create table public.document_shares (id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  token text unique not null, expires_at timestamptz not null, revoked boolean not null default false, created_at timestamptz not null default now());
create table public.signatures (id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  signer_name text not null, signed_at timestamptz not null default now());

alter table public.plans enable row level security;
alter table public.profiles enable row level security;
alter table public.invoices enable row level security;
alter table public.webhook_events enable row level security;
alter table public.document_shares enable row level security;
alter table public.signatures enable row level security;

create function public.is_admin() returns boolean language sql security definer set search_path = public stable as
$$ select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin') $$;

create policy "Anyone can read plans" on public.plans for select to anon, authenticated using (true);
create policy "Admins edit plans" on public.plans for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Read own profile or admin" on public.profiles for select to authenticated using ((select auth.uid()) = id or public.is_admin());
create policy "Read own invoices" on public.invoices for select to authenticated using ((select auth.uid()) = user_id);
create policy "Owners manage shares" on public.document_shares for all to authenticated
  using (exists(select 1 from public.documents d where d.id = document_id and d.user_id = (select auth.uid())))
  with check (exists(select 1 from public.documents d where d.id = document_id and d.user_id = (select auth.uid())));
create policy "Owners read signatures" on public.signatures for select to authenticated
  using (exists(select 1 from public.documents d where d.id = document_id and d.user_id = (select auth.uid())));

create function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as
$$ begin insert into public.profiles(id,email) values (new.id,new.email) on conflict do nothing; return new; end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- Server-side monthly quota (blocks new documents over the plan limit)
create function public.check_quota() returns trigger language plpgsql security definer set search_path = public as $$
declare lim int; used int;
begin
  if exists(select 1 from public.documents where id = new.id) then return new; end if;
  select p.monthly_docs into lim from public.profiles f join public.plans p on p.id = f.plan where f.id = new.user_id;
  select count(*) into used from public.documents where user_id = new.user_id and created_at >= date_trunc('month', now());
  if lim is not null and used >= lim then raise exception 'Monthly document limit reached. Please upgrade your plan.'; end if;
  return new;
end $$;
create trigger documents_quota before insert on public.documents for each row execute function public.check_quota();

-- Public share link + e-signature (token-based, no login needed)
create function public.get_shared_document(p_token text) returns json language sql security definer set search_path = public as $$
  select json_build_object('title', d.title, 'template_id', d.template_id, 'data', d.data,
    'signatures', (select coalesce(json_agg(json_build_object('name', s.signer_name, 'at', s.signed_at) order by s.signed_at), '[]'::json) from public.signatures s where s.document_id = d.id))
  from public.document_shares sh join public.documents d on d.id = sh.document_id
  where sh.token = p_token and not sh.revoked and sh.expires_at > now() $$;
create function public.sign_shared_document(p_token text, p_name text) returns boolean language plpgsql security definer set search_path = public as $$
declare v uuid;
begin
  select sh.document_id into v from public.document_shares sh where sh.token = p_token and not sh.revoked and sh.expires_at > now();
  if v is null or length(trim(p_name)) < 2 then return false; end if;
  insert into public.signatures(document_id, signer_name) values (v, trim(p_name));
  return true;
end $$;
grant execute on function public.get_shared_document(text), public.sign_shared_document(text, text) to anon, authenticated;

-- Admin dashboard: aggregated numbers only, never document contents
create function public.admin_stats() returns json language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Not allowed'; end if;
  return json_build_object(
    'users', (select count(*) from public.profiles),
    'documents', (select count(*) from public.documents),
    'docs_30d', (select count(*) from public.documents where created_at > now() - interval '30 days'),
    'completed', (select count(*) from public.documents where status = 'completed'),
    'shares', (select count(*) from public.document_shares where not revoked and expires_at > now()),
    'signatures', (select count(*) from public.signatures),
    'revenue_cents', (select coalesce(sum(amount_paid), 0) from public.invoices),
    'plans', (select coalesce(json_object_agg(plan, c), '{}'::json) from (select plan, count(*) c from public.profiles group by plan) x),
    'templates', (select coalesce(json_object_agg(template_id, c), '{}'::json) from (select template_id, count(*) c from public.documents group by template_id) y));
end $$;
revoke execute on function public.admin_stats() from anon;

-- To make yourself an admin (run once, with your own email):
-- update public.profiles set role = 'admin' where email = 'you@example.com';
