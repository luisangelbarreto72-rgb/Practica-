import { unwrap, type Supabase } from "./shared";

export const DEFAULT_MIN_PASSING_GRADE = 60;

/** Nota mínima global del estudiante (profiles.default_min_passing_grade). */
export async function fetchMinPassingGrade(sb: Supabase, userId: string): Promise<number> {
  const row = unwrap(
    await sb.from("profiles").select("default_min_passing_grade").eq("id", userId).maybeSingle()
  );
  const value = row ? Number((row as { default_min_passing_grade: unknown }).default_min_passing_grade) : NaN;
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_MIN_PASSING_GRADE;
}
