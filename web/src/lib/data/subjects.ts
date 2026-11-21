import type { Subject } from "@/types/database";
import { toSubject, unwrap, type Supabase } from "./shared";
import type { SubjectInput } from "./types";

/** RLS ya filtra por usuario: solo devuelve las materias del estudiante autenticado. */
export async function fetchSubjects(sb: Supabase): Promise<Subject[]> {
  const rows = unwrap(
    await sb.from("subjects").select("*").eq("is_archived", false).order("created_at", { ascending: true })
  );
  return (rows ?? []).map(toSubject);
}

export async function createSubject(sb: Supabase, userId: string, input: SubjectInput): Promise<Subject> {
  const row = unwrap(
    await sb
      .from("subjects")
      .insert({
        user_id: userId,
        name: input.name,
        color_hex: input.color_hex,
        min_passing_grade: input.min_passing_grade,
        absences_count: input.absences_count ?? 0,
        max_absences: input.max_absences ?? 4,
        professor: input.professor ?? null,
        resource_url: input.resource_url ?? null,
      })
      .select()
      .single()
  );
  return toSubject(row);
}

export async function updateSubject(sb: Supabase, id: string, input: SubjectInput): Promise<Subject> {
  const patch: Record<string, unknown> = {
    name: input.name,
    color_hex: input.color_hex,
    min_passing_grade: input.min_passing_grade,
  };
  if (input.absences_count !== undefined) patch.absences_count = input.absences_count;
  if (input.max_absences !== undefined) patch.max_absences = input.max_absences;
  if (input.professor !== undefined) patch.professor = input.professor;
  if (input.resource_url !== undefined) patch.resource_url = input.resource_url;

  const row = unwrap(
    await sb
      .from("subjects")
      .update(patch)
      .eq("id", id)
      .select()
      .single()
  );
  return toSubject(row);
}

export async function updateSubjectAbsences(sb: Supabase, id: string, absencesCount: number): Promise<Subject> {
  const safeCount = Math.max(0, Math.trunc(absencesCount));
  const row = unwrap(
    await sb
      .from("subjects")
      .update({ absences_count: safeCount })
      .eq("id", id)
      .select()
      .single()
  );
  return toSubject(row);
}

/** Borra la materia; sus evaluaciones se eliminan en cascada (ON DELETE CASCADE). */
export async function deleteSubject(sb: Supabase, id: string): Promise<void> {
  unwrap(await sb.from("subjects").delete().eq("id", id));
}
