-- ============================================================================
-- Gestor Académico — esquema de base de datos para Supabase (PostgreSQL)
-- Pégalo completo en: Supabase Dashboard → SQL Editor → New query → Run.
-- Es idempotente en lo posible: si lo ejecutas dos veces, fallará en "CREATE TABLE"
-- (borra las tablas primero si quieres empezar de cero).
-- Coincide con web/src/types/database.ts
-- ============================================================================

-- 1. PROFILES: extiende auth.users con preferencias del estudiante ------------
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  default_min_passing_grade NUMERIC(5,2) NOT NULL DEFAULT 60.00
    CHECK (default_min_passing_grade > 0 AND default_min_passing_grade <= 100),
  theme_preference TEXT NOT NULL DEFAULT 'system'
    CHECK (theme_preference IN ('light', 'dark', 'system')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. SUBJECTS: materias --------------------------------------------------------
CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (length(trim(name)) > 0),
  color_hex TEXT NOT NULL DEFAULT '#042940'
    CHECK (color_hex ~ '^#[0-9A-Fa-f]{6}$'),
  -- NULL = hereda profiles.default_min_passing_grade
  min_passing_grade NUMERIC(5,2)
    CHECK (min_passing_grade IS NULL OR (min_passing_grade > 0 AND min_passing_grade <= 100)),
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Necesario para la clave foránea compuesta de evaluations (ver abajo)
  UNIQUE (id, user_id)
);

-- 3. EVALUATIONS: evaluaciones pendientes y calificadas ------------------------
CREATE TABLE public.evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL,
  title TEXT NOT NULL CHECK (length(trim(title)) > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'graded')),
  due_date DATE,
  weight_percentage NUMERIC(5,2) NOT NULL
    CHECK (weight_percentage > 0 AND weight_percentage <= 100),
  max_score NUMERIC(6,2) NOT NULL DEFAULT 100.00 CHECK (max_score > 0),
  earned_score NUMERIC(6,2),
  reminder_days INT NOT NULL DEFAULT 3 CHECK (reminder_days >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Una evaluación calificada DEBE tener nota; la nota no puede superar el máximo.
  CONSTRAINT graded_requires_score CHECK (
    (status = 'pending') OR (status = 'graded' AND earned_score IS NOT NULL)
  ),
  CONSTRAINT earned_within_max CHECK (
    earned_score IS NULL OR (earned_score >= 0 AND earned_score <= max_score)
  ),

  -- FK compuesta: la materia debe pertenecer al MISMO usuario. Impide que alguien
  -- cuelgue una evaluación de la materia de otro estudiante aunque conozca su UUID.
  CONSTRAINT evaluations_subject_owner_fk
    FOREIGN KEY (subject_id, user_id)
    REFERENCES public.subjects (id, user_id) ON DELETE CASCADE
);

-- 4. ÍNDICES --------------------------------------------------------------------
CREATE INDEX idx_subjects_user ON public.subjects (user_id);
CREATE INDEX idx_evaluations_subject ON public.evaluations (subject_id);
CREATE INDEX idx_evaluations_user_pending_date
  ON public.evaluations (user_id, due_date ASC)
  WHERE status = 'pending';

-- 5. updated_at automático -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER evaluations_set_updated_at
  BEFORE UPDATE ON public.evaluations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 6. ROW LEVEL SECURITY: cada estudiante solo ve y modifica lo suyo ----------------
ALTER TABLE public.profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;

-- (select auth.uid()) en vez de auth.uid(): Postgres lo evalúa una sola vez por consulta.
CREATE POLICY "Users manage own profile"
  ON public.profiles FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

CREATE POLICY "Users manage own subjects"
  ON public.subjects FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users manage own evaluations"
  ON public.evaluations FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- 7. Crear el perfil automáticamente al registrarse un usuario ---------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
