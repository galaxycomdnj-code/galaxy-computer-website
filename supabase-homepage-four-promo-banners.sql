-- Expand homepage promotional banners to four independent slots.
-- Cover Photo Slider remains a separate type.
alter table public.homepage_banners
  drop constraint if exists homepage_banners_banner_type_check;

alter table public.homepage_banners
  add constraint homepage_banners_banner_type_check
  check (banner_type in ('cover', 'seasonal', 'promo_2', 'promo_3', 'promo_4'));
