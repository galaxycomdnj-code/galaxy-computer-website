-- Galaxy Computer homepage merchandising and campaign management
-- Safe to run more than once in Supabase SQL Editor.

alter table public.products
  add column if not exists flash_sale_enabled boolean not null default false,
  add column if not exists flash_sale_price numeric(12,2),
  add column if not exists flash_sale_end_at timestamptz,
  add column if not exists flash_sale_order integer not null default 1;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.products'::regclass
      and conname = 'products_flash_sale_price_valid'
  ) then
    alter table public.products
      add constraint products_flash_sale_price_valid
      check (
        not flash_sale_enabled
        or (
          price is not null
          and flash_sale_price is not null
          and flash_sale_price > 0
          and flash_sale_price < price
        )
      );
  end if;
end $$;

create index if not exists products_flash_sale_listing_idx
  on public.products (flash_sale_order, created_at desc)
  where flash_sale_enabled = true;

create table if not exists public.homepage_banners (
  id uuid primary key default gen_random_uuid(),
  banner_type text not null check (banner_type in ('cover', 'seasonal')),
  title text not null default '',
  image_url text not null,
  target_url text not null default '#products',
  is_active boolean not null default true,
  display_order integer not null default 1,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint homepage_banners_image_url_https
    check (image_url ~ '^https://'),
  constraint homepage_banners_target_url_safe
    check (target_url = '' or target_url like 'https://%' or target_url like 'http://%' or target_url like '/%' or target_url like '#%'),
  constraint homepage_banners_valid_window
    check (starts_at is null or ends_at is null or ends_at > starts_at)
);

create index if not exists homepage_banners_active_order_idx
  on public.homepage_banners (banner_type, display_order, created_at)
  where is_active = true;

alter table public.homepage_banners enable row level security;

drop policy if exists "Public can view active homepage banners" on public.homepage_banners;
create policy "Public can view active homepage banners"
  on public.homepage_banners
  for select
  to anon, authenticated
  using (
    is_active = true
    and (starts_at is null or starts_at <= now())
    and (ends_at is null or ends_at > now())
  );

drop policy if exists "Admins can manage homepage banners" on public.homepage_banners;
create policy "Admins can manage homepage banners"
  on public.homepage_banners
  for all
  to authenticated
  using (
    exists (
      select 1 from public.admins
      where admins.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.admins
      where admins.user_id = auth.uid()
    )
  );

grant select on public.homepage_banners to anon, authenticated;
grant insert, update, delete on public.homepage_banners to authenticated;
