import { mockEvaluations, mockSubjects } from "@/lib/mock-data";
import type { Evaluation, Subject } from "@/types/database";
import { toEvaluation, toSubject, unwrap, type Supabase } from "./shared";

/**
 * Inserta en la cuenta del usuario las materias y evaluaciones de ejemplo
 * (las mismas de mock-data.ts, con fechas relativas a hoy).
 */
export async function seedSampleData(
  sb: Supabase,
  userId: string
): Promise<{ subjects: Subject[]; evaluations: Evaluation[] }> {
  const subjectRows = unwrap(
    await sb
      .from("subjects")
      .insert(
        mockSubjects.map((s) => ({
          user_id: userId,
          name: s.name,
          color_hex: s.color_hex,
          min_passing_grade: null,
          absences_count: s.absences_count,
          max_absences: s.max_absences,
          professor: s.professor,
          resource_url: s.resource_url,
        }))
      )
      .select()
  );
  const subjects = (subjectRows ?? []).map(toSubject);

  const idByName = new Map(subjects.map((s) => [s.name, s.id]));
  const newIdByMockId = new Map(mockSubjects.map((s) => [s.id, idByName.get(s.name)]));

  const evaluationRows = unwrap(
    await sb
      .from("evaluations")
      .insert(
        mockEvaluations.map((e) => ({
          user_id: userId,
          subject_id: newIdByMockId.get(e.subject_id),
          title: e.title,
          status: e.status,
          due_date: e.due_date,
          weight_percentage: e.weight_percentage,
          max_score: e.max_score,
          earned_score: e.earned_score,
          reminder_days: e.reminder_days,
        }))
      )
      .select()
  );
  return { subjects, evaluations: (evaluationRows ?? []).map(toEvaluation) };
}
