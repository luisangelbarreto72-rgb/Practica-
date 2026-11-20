import { unwrap, type Supabase } from "./shared";
import type { ProfileData } from "./types";

export const DEFAULT_MIN_PASSING_GRADE = 60;

/** Perfil del estudiante (nombre y nota mínima global). Valores por defecto si no existe la fila. */
export async function fetchProfile(sb: Supabase, userId: string): Promise<ProfileData> {
  const row = unwrap(
    await sb.from("profiles").select("full_name, default_min_passing_grade").eq("id", userId).maybeSingle()
  ) as { full_name: string | null; default_min_passing_grade: unknown } | null;
  const min = row ? Number(row.default_min_passing_grade) : NaN;
  return {
    full_name: row?.full_name?.trim() || null,
    default_min_passing_grade: Number.isFinite(min) && min > 0 ? min : DEFAULT_MIN_PASSING_GRADE,
  };
}

/** Crea o actualiza el perfil (upsert: tolera cuentas sin fila en `profiles`). */
export async function saveProfile(sb: Supabase, userId: string, data: ProfileData): Promise<ProfileData> {
  const row = unwrap(
    await sb
      .from("profiles")
      .upsert({ id: userId, full_name: data.full_name, default_min_passing_grade: data.default_min_passing_grade })
      .select("full_name, default_min_passing_grade")
      .single()
  ) as { full_name: string | null; default_min_passing_grade: unknown };
  return { full_name: row.full_name, default_min_passing_grade: Number(row.default_min_passing_grade) };
}
