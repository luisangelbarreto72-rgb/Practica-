import type { Evaluation } from "@/types/database";
import { toEvaluation, unwrap, type Supabase } from "./shared";
import type { EvaluationPatch, NewEvaluationData } from "./types";

export async function fetchEvaluations(sb: Supabase): Promise<Evaluation[]> {
  const rows = unwrap(await sb.from("evaluations").select("*").order("created_at", { ascending: true }));
  return (rows ?? []).map(toEvaluation);
}

export async function createEvaluation(sb: Supabase, userId: string, data: NewEvaluationData): Promise<Evaluation> {
  const row = unwrap(
    await sb
      .from("evaluations")
      .insert({
        user_id: userId,
        subject_id: data.subject_id,
        title: data.title,
        due_date: data.due_date,
        weight_percentage: data.weight_percentage,
        status: "pending",
        max_score: 100,
        earned_score: null,
        reminder_days: 3,
      })
      .select()
      .single()
  );
  return toEvaluation(row);
}

export async function updateEvaluation(sb: Supabase, id: string, patch: EvaluationPatch): Promise<Evaluation> {
  const row = unwrap(await sb.from("evaluations").update(patch).eq("id", id).select().single());
  return toEvaluation(row);
}

export async function deleteEvaluation(sb: Supabase, id: string): Promise<void> {
  unwrap(await sb.from("evaluations").delete().eq("id", id));
}
