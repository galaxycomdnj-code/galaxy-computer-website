-- Create editable names for the four homepage promotional banner slots.
create table if not exists public.homepage_banner_slots (
  slot_key text primary key check (slot_key in ('seasonal','promo_2','promo_3','promo_4')),
  display_name text not null check (char_length(trim(display_name)) between 1 and 60),
  updated_at timestamptz not null default now()
);
alter table public.homepage_banner_slots enable row level security;
drop policy if exists "Public can read homepage banner slot names" on public.homepage_banner_slots;
create policy "Public can read homepage banner slot names"
  on public.homepage_banner_slots for select using (true);
drop policy if exists "Admins can insert homepage banner slot names" on public.homepage_banner_slots;
create policy "Admins can insert homepage banner slot names"
  on public.homepage_banner_slots for insert to authenticated
  with check (exists (select 1 from public.admins where user_id = auth.uid()));
drop policy if exists "Admins can update homepage banner slot names" on public.homepage_banner_slots;
create policy "Admins can update homepage banner slot names"
  on public.homepage_banner_slots for update to authenticated
  using (exists (select 1 from public.admins where user_id = auth.uid()))
  with check (exists (select 1 from public.admins where user_id = auth.uid()));
insert into public.homepage_banner_slots (slot_key, display_name) values
  ('seasonal','Seasonal Offer'),
  ('promo_2','Special Deal'),
  ('promo_3','New Arrival'),
  ('promo_4','Featured Campaign')
on conflict (slot_key) do nothing;
