-- =============================================================
-- 🧾 CV SYSTEM — TABLES STRUCTURE
-- =============================================================
-- Description :
--   This migration adds all the necessary tables to manage
--   public CV data for each entreprise (photo, bio, skills,
--   experiences, education...).
--
--   All tables are linked to entreprise via entreprise_id.
--   The system is fully extensible and safe for future evolutions.
-- =============================================================

-- =============================================================
-- 1️⃣ TABLE: cv_profiles
-- -------------------------------------------------------------
-- Holds main CV metadata (bio, title, location, photo).
-- One per entreprise.
-- =============================================================

create table if not exists public.cv_profiles (
  id bigint primary key generated always as identity,
  entreprise_id bigint not null references public.entreprise(id) on delete cascade,
  job_title text,
  location text,
  bio text,
  photo_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Optional: enforce one CV per entreprise
create unique index if not exists cv_profiles_entreprise_id_key
on public.cv_profiles(entreprise_id);

-- =============================================================
-- 2️⃣ TABLE: cv_skills
-- -------------------------------------------------------------
-- Simple list of skills (tags) linked to entreprise.
-- =============================================================

create table if not exists public.cv_skills (
  id bigint primary key generated always as identity,
  entreprise_id bigint not null references public.entreprise(id) on delete cascade,
  name text not null,
  created_at timestamp with time zone default now()
);

create index if not exists cv_skills_entreprise_id_idx
on public.cv_skills(entreprise_id);

-- =============================================================
-- 3️⃣ TABLE: cv_experiences
-- -------------------------------------------------------------
-- Professional experiences timeline.
-- =============================================================

create table if not exists public.cv_experiences (
  id bigint primary key generated always as identity,
  entreprise_id bigint not null references public.entreprise(id) on delete cascade,
  title text not null,
  company text,
  start_date date,
  end_date date,
  description text,
  created_at timestamp with time zone default now()
);

create index if not exists cv_experiences_entreprise_id_idx
on public.cv_experiences(entreprise_id);

-- =============================================================
-- 4️⃣ TABLE: cv_education
-- -------------------------------------------------------------
-- Education / certifications (optional but nice to have).
-- =============================================================

create table if not exists public.cv_education (
  id bigint primary key generated always as identity,
  entreprise_id bigint not null references public.entreprise(id) on delete cascade,
  title text not null,
  school text,
  year text,
  created_at timestamp with time zone default now()
);

create index if not exists cv_education_entreprise_id_idx
on public.cv_education(entreprise_id);

-- =============================================================
-- 🧩 Optional helper trigger to auto-update "updated_at"
-- on cv_profiles (keeps bio timestamps consistent)
-- =============================================================

create or replace function public.cv_profiles_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_cv_profiles_updated_at on public.cv_profiles;

create trigger update_cv_profiles_updated_at
before update on public.cv_profiles
for each row execute function public.cv_profiles_updated_at();

-- =============================================================
-- ✅ END OF MIGRATION
-- =============================================================
