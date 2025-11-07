
-- SIMPLE SCHEMA FOR VERSION 14b

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  date date not null,
  type text check (type in ('income','expense')) not null,
  category text,
  method text,
  amount numeric not null,
  notes text,
  created_at timestamptz default now()
);

create table if not exists public.balances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  kind text check (kind in ('capital','cash','gcash','bank')) not null,
  label text,
  amount numeric not null default 0,
  updated_at timestamptz default now()
);

alter table public.transactions enable row level security;
alter table public.balances enable row level security;

drop policy if exists tx_select_own on public.transactions;
drop policy if exists tx_ins_own on public.transactions;
drop policy if exists tx_upd_own on public.transactions;
drop policy if exists tx_del_own on public.transactions;

drop policy if exists bal_select_own on public.balances;
drop policy if exists bal_ins_own on public.balances;
drop policy if exists bal_upd_own on public.balances;
drop policy if exists bal_del_own on public.balances;

create policy tx_select_own on public.transactions
  for select using (auth.uid() = user_id);

create policy tx_ins_own on public.transactions
  for insert with check (auth.uid() = user_id);

create policy tx_upd_own on public.transactions
  for update using (auth.uid() = user_id);

create policy tx_del_own on public.transactions
  for delete using (auth.uid() = user_id);

create policy bal_select_own on public.balances
  for select using (auth.uid() = user_id);

create policy bal_ins_own on public.balances
  for insert with check (auth.uid() = user_id);

create policy bal_upd_own on public.balances
  for update using (auth.uid() = user_id);

create policy bal_del_own on public.balances
  for delete using (auth.uid() = user_id);

create or replace function public.set_user_id() returns trigger as $$
begin
  if new.user_id is null then
    new.user_id := auth.uid();
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists set_user_id_transactions on public.transactions;
drop trigger if exists set_user_id_balances on public.balances;

create trigger set_user_id_transactions
before insert on public.transactions
for each row execute function public.set_user_id();

create trigger set_user_id_balances
before insert on public.balances
for each row execute function public.set_user_id();

select pg_notify('pgrst','reload schema');
