-- Run this in the Supabase SQL Editor (Project > SQL Editor > New query)

create table if not exists settings (
  id text primary key default 'studio',
  studio_name text not null default '',
  subtitle text not null default '',
  description text not null default '',
  contact_email text,
  contact_phone text,
  contact_address text,
  instagram_url text,
  footer_text text,
  theme text not null default 'system',
  watermark_enabled boolean,
  watermark_image_url text,
  watermark_position text,
  watermark_opacity numeric,
  watermark_scale numeric,
  watermark_remove_white_bg boolean
);

create table if not exists albums (
  id text primary key,
  title text not null,
  description text not null default '',
  cover_image text not null default '',
  category text not null default '',
  location text,
  event_date text,
  is_private boolean not null default false,
  password text,
  created_at timestamptz not null default now(),
  photo_count int
);

create table if not exists photos (
  id text primary key,
  album_id text not null references albums(id) on delete cascade,
  url text not null,
  thumbnail_url text not null default '',
  filename text not null default '',
  width int,
  height int,
  aspect_ratio numeric,
  "order" int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists orders (
  id text primary key,
  album_id text not null,
  album_title text not null default '',
  client_name text not null default '',
  client_email text not null default '',
  cover_title text not null default '',
  cover_subtitle text not null default '',
  layout_style text not null default 'editorial',
  book_size text not null default '',
  photo_ids jsonb not null default '[]',
  total_price numeric not null default 0,
  payment_method text not null default 'bank_transfer',
  payment_reference text not null default '',
  payment_sender_name text not null default '',
  payment_receipt_url text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  delivery_address text,
  delivery_phone text
);

alter table settings enable row level security;
alter table albums enable row level security;
alter table photos enable row level security;
alter table orders enable row level security;

-- Public read access (gallery is public-facing)
drop policy if exists "public read settings" on settings;
create policy "public read settings" on settings for select using (true);

drop policy if exists "public read albums" on albums;
create policy "public read albums" on albums for select using (true);

drop policy if exists "public read photos" on photos;
create policy "public read photos" on photos for select using (true);

drop policy if exists "public read orders" on orders;
create policy "public read orders" on orders for select using (true);

-- Writes require a signed-in Supabase Auth session (the admin dashboard signs in
-- via supabase.auth.signInWithPassword). Create the admin user in
-- Supabase Dashboard > Authentication > Users > Add user (email + password).
drop policy if exists "public write settings" on settings;
drop policy if exists "admin write settings" on settings;
create policy "admin write settings" on settings for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "public write albums" on albums;
drop policy if exists "admin write albums" on albums;
create policy "admin write albums" on albums for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "public write photos" on photos;
drop policy if exists "admin write photos" on photos;
create policy "admin write photos" on photos for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Orders are placed by anonymous customers via the public photobook checkout,
-- so INSERT must stay open. Only the admin dashboard should update/cancel/delete them.
drop policy if exists "public write orders" on orders;
drop policy if exists "admin write orders" on orders;
drop policy if exists "public insert orders" on orders;
create policy "public insert orders" on orders for insert
  with check (true);

drop policy if exists "admin update orders" on orders;
create policy "admin update orders" on orders for update
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "admin delete orders" on orders;
create policy "admin delete orders" on orders for delete
  using (auth.role() = 'authenticated');
