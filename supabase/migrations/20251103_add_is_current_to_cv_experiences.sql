-- =============================================================
-- 🎓 CV EXPERIENCES — Ajout du champ "is_current"
-- =============================================================
alter table public.cv_experiences
add column if not exists is_current boolean default false;
