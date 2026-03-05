-- Admin CMS bootstrap/repair migration
-- Creates missing CMS tables and policies used by Admin panel.

create extension if not exists "uuid-ossp";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- hero_slides
create table if not exists public.hero_slides (
  id uuid primary key default uuid_generate_v4(),
  image_url text not null,
  headline text not null,
  subheadline text,
  cta1_text text,
  cta1_link text,
  cta2_text text,
  cta2_link text,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.hero_slides enable row level security;
drop policy if exists "Allow public read access for active slides" on public.hero_slides;
create policy "Allow public read access for active slides" on public.hero_slides for select using (is_active = true);
drop policy if exists "Allow admins full access to hero_slides" on public.hero_slides;
create policy "Allow admins full access to hero_slides" on public.hero_slides for all using (public.has_role(auth.uid(), 'admin'::public.app_role));
create index if not exists idx_hero_slides_display_order on public.hero_slides(display_order);
drop trigger if exists trg_hero_slides_updated_at on public.hero_slides;
create trigger trg_hero_slides_updated_at before update on public.hero_slides for each row execute function public.set_updated_at();

-- promo_banners
create table if not exists public.promo_banners (
  id uuid primary key default uuid_generate_v4(),
  badge_text text not null,
  headline text not null,
  subheadline text,
  cta_text text,
  cta_link text,
  discount_percentage integer,
  end_date timestamptz not null,
  background_color text not null default '#000000',
  text_color text not null default '#FFFFFF',
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.promo_banners enable row level security;
drop policy if exists "Allow public read access for active promo_banners" on public.promo_banners;
create policy "Allow public read access for active promo_banners" on public.promo_banners for select using (is_active = true);
drop policy if exists "Allow admins full access to promo_banners" on public.promo_banners;
create policy "Allow admins full access to promo_banners" on public.promo_banners for all using (public.has_role(auth.uid(), 'admin'::public.app_role));
create index if not exists idx_promo_banners_display_order on public.promo_banners(display_order);
create index if not exists idx_promo_banners_end_date on public.promo_banners(end_date);
drop trigger if exists trg_promo_banners_updated_at on public.promo_banners;
create trigger trg_promo_banners_updated_at before update on public.promo_banners for each row execute function public.set_updated_at();

-- features
create table if not exists public.features (
  id uuid primary key default uuid_generate_v4(),
  icon_name text not null,
  title text not null,
  description text not null,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.features enable row level security;
drop policy if exists "Allow public read access for active features" on public.features;
create policy "Allow public read access for active features" on public.features for select using (is_active = true);
drop policy if exists "Allow admins full access to features" on public.features;
create policy "Allow admins full access to features" on public.features for all using (public.has_role(auth.uid(), 'admin'::public.app_role));
create index if not exists idx_features_display_order on public.features(display_order);
drop trigger if exists trg_features_updated_at on public.features;
create trigger trg_features_updated_at before update on public.features for each row execute function public.set_updated_at();

-- testimonials_cms
create table if not exists public.testimonials_cms (
  id uuid primary key default uuid_generate_v4(),
  customer_name text not null,
  location text,
  rating integer not null default 5 check (rating >= 1 and rating <= 5),
  review_text text not null,
  pet_name text,
  image_url text,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.testimonials_cms enable row level security;
drop policy if exists "Allow public read access for active testimonials" on public.testimonials_cms;
create policy "Allow public read access for active testimonials" on public.testimonials_cms for select using (is_active = true);
drop policy if exists "Allow admins full access to testimonials" on public.testimonials_cms;
create policy "Allow admins full access to testimonials" on public.testimonials_cms for all using (public.has_role(auth.uid(), 'admin'::public.app_role));
create index if not exists idx_testimonials_display_order on public.testimonials_cms(display_order);
drop trigger if exists trg_testimonials_updated_at on public.testimonials_cms;
create trigger trg_testimonials_updated_at before update on public.testimonials_cms for each row execute function public.set_updated_at();

-- newsletter_config
create table if not exists public.newsletter_config (
  id uuid primary key default uuid_generate_v4(),
  badge_text text not null default 'Join the Family',
  headline text not null default 'Unlock 10% Off Your First Order',
  description text not null default 'Plus get early access to new collections, exclusive offers, and adorable pet content.',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.newsletter_config enable row level security;
drop policy if exists "Allow public read access for newsletter_config" on public.newsletter_config;
create policy "Allow public read access for newsletter_config" on public.newsletter_config for select using (true);
drop policy if exists "Allow admins full access to newsletter_config" on public.newsletter_config;
create policy "Allow admins full access to newsletter_config" on public.newsletter_config for all using (public.has_role(auth.uid(), 'admin'::public.app_role));
drop trigger if exists trg_newsletter_config_updated_at on public.newsletter_config;
create trigger trg_newsletter_config_updated_at before update on public.newsletter_config for each row execute function public.set_updated_at();

insert into public.newsletter_config (badge_text, headline, description, is_active)
select 'Join the Family', 'Unlock 10% Off Your First Order', 'Plus get early access to new collections, exclusive offers, and adorable pet content.', true
where not exists (select 1 from public.newsletter_config);

-- instagram_posts
create table if not exists public.instagram_posts (
  id uuid primary key default uuid_generate_v4(),
  image_url text not null,
  caption text,
  post_url text not null,
  likes_count integer not null default 0,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.instagram_posts enable row level security;
drop policy if exists "Allow public read access for active instagram_posts" on public.instagram_posts;
create policy "Allow public read access for active instagram_posts" on public.instagram_posts for select using (is_active = true);
drop policy if exists "Allow admins full access to instagram_posts" on public.instagram_posts;
create policy "Allow admins full access to instagram_posts" on public.instagram_posts for all using (public.has_role(auth.uid(), 'admin'::public.app_role));
create index if not exists idx_instagram_display_order on public.instagram_posts(display_order);
drop trigger if exists trg_instagram_posts_updated_at on public.instagram_posts;
create trigger trg_instagram_posts_updated_at before update on public.instagram_posts for each row execute function public.set_updated_at();

