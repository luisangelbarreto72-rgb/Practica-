-- ============================================================================
-- Migración 003 — Control de inasistencias, profesor y carpeta de estudio
-- Pégala en: Supabase Dashboard → SQL Editor → New query → Run.
-- Es idempotente: puedes ejecutarla más de una vez sin errores.
-- Coincide con web/src/types/database.ts (Subject)
-- ============================================================================

-- 1. NUEVAS COLUMNAS EN SUBJECTS ----------------------------------------------
ALTER TABLE public.subjects
  ADD COLUMN IF NOT EXISTS absences_count INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_absences   INT NOT NULL DEFAULT 4,
  ADD COLUMN IF NOT EXISTS professor      TEXT,
  ADD COLUMN IF NOT EXISTS resource_url   TEXT;

-- Restricciones de integridad (idempotentes)
ALTER TABLE public.subjects
  DROP CONSTRAINT IF EXISTS subjects_absences_count_non_negative,
  ADD CONSTRAINT subjects_absences_count_non_negative CHECK (absences_count >= 0);

ALTER TABLE public.subjects
  DROP CONSTRAINT IF EXISTS subjects_max_absences_positive,
  ADD CONSTRAINT subjects_max_absences_positive CHECK (max_absences >= 1);

-- 2. ROW LEVEL SECURITY -------------------------------------------------------
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own subjects" ON public.subjects;
CREATE POLICY "Users manage own subjects"
  ON public.subjects FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- 3. GRANTS -------------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subjects TO authenticated;
