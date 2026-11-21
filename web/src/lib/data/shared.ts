import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import type { Evaluation, Subject } from "@/types/database";

export type Supabase = SupabaseClient;

/** Devuelve `data` o lanza un Error con el mensaje de PostgREST. */
export function unwrap<T>(res: { data: T; error: PostgrestError | null }): NonNullable<T> {
  if (res.error) throw new Error(res.error.message);
  return res.data as NonNullable<T>;
}

// PostgREST devuelve NUMERIC como número, pero normalizamos por seguridad.
const num = (v: unknown): number => Number(v);
const numOrNull = (v: unknown): number | null => (v === null || v === undefined ? null : Number(v));

export function toSubject(r: Record<string, unknown>): Subject {
  return {
    ...(r as unknown as Subject),
    min_passing_grade: numOrNull(r.min_passing_grade),
    absences_count: r.absences_count !== undefined && r.absences_count !== null ? num(r.absences_count) : 0,
    max_absences: r.max_absences !== undefined && r.max_absences !== null ? num(r.max_absences) : 4,
    professor: typeof r.professor === "string" && r.professor.trim() !== "" ? r.professor : null,
    resource_url: typeof r.resource_url === "string" && r.resource_url.trim() !== "" ? r.resource_url : null,
  };
}

export function toEvaluation(r: Record<string, unknown>): Evaluation {
  return {
    ...(r as unknown as Evaluation),
    weight_percentage: num(r.weight_percentage),
    max_score: num(r.max_score),
    earned_score: numOrNull(r.earned_score),
    reminder_days: num(r.reminder_days),
  };
}
