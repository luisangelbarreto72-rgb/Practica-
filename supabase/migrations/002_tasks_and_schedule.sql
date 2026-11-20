-- ============================================================================
-- Migración 002 — Tareas rápidas (to-do) y horario semanal de clases
-- Pégala en: Supabase Dashboard → SQL Editor → New query → Run.
-- Es idempotente: puedes ejecutarla más de una vez sin errores.
-- Coincide con web/src/types/database.ts (Task, ClassBlock)
-- ============================================================================

-- 1. TASKS: pendientes rápidos sin calificación --------------------------------
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (length(trim(title)) > 0),
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tasks_user ON public.tasks (user_id, is_completed, created_at);

-- 2. CLASS_BLOCKS: bloques del horario semanal -----------------------------------
CREATE TABLE IF NOT EXISTS public.class_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL,
  -- 1 = lunes … 7 = domingo (ISO 8601)
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT class_blocks_time_order CHECK (end_time > start_time),
  -- FK compuesta: la materia debe ser del MISMO usuario (igual que en evaluations)
  CONSTRAINT class_blocks_subject_owner_fk
    FOREIGN KEY (subject_id, user_id)
    REFERENCES public.subjects (id, user_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_class_blocks_user_day
  ON public.class_blocks (user_id, day_of_week, start_time);

-- 3. ROW LEVEL SECURITY ---------------------------------------------------------
ALTER TABLE public.tasks        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own tasks" ON public.tasks;
CREATE POLICY "Users manage own tasks"
  ON public.tasks FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users manage own class blocks" ON public.class_blocks;
CREATE POLICY "Users manage own class blocks"
  ON public.class_blocks FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- 4. GRANTS: RLS filtra filas, pero el rol necesita además permiso sobre la tabla.
-- (Se repiten los de las tablas anteriores por si tu proyecto no los tenía.)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks        TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.class_blocks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles     TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subjects     TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.evaluations  TO authenticated;
