-- Athlete profile and private training gallery.
alter table profiles
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists age integer check (age between 13 and 100),
  add column if not exists height_cm integer check (height_cm between 100 and 250),
  add column if not exists weight_kg numeric(5,2) check (weight_kg between 30 and 300),
  add column if not exists titles_belts text[] not null default '{}',
  add column if not exists years_practicing integer check (years_practicing between 0 and 80),
  add column if not exists preferred_techniques text[] not null default '{}',
  add column if not exists training_music text[] not null default '{}',
  add column if not exists disciplines text[] not null default '{}',
  add column if not exists dominant_stance text,
  add column if not exists weight_class text,
  add column if not exists current_goals text,
  add column if not exists youtube_url text,
  add column if not exists spotify_url text,
  add column if not exists deezer_url text,
  add column if not exists apple_music_url text,
  add column if not exists profile_visibility text not null default 'private' check (profile_visibility in ('private', 'public'));

create table if not exists training_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid references training_sessions(id) on delete set null,
  storage_path text not null unique,
  caption text check (char_length(caption) <= 240),
  created_at timestamptz not null default now()
);

alter table training_photos enable row level security;
create policy "training_photos_own" on training_photos for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('training-photos', 'training-photos', false)
on conflict (id) do nothing;

create policy "training_photo_objects_own" on storage.objects for all
  using (bucket_id = 'training-photos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'training-photos' and (storage.foldername(name))[1] = auth.uid()::text);
