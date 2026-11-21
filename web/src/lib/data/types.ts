import type { EvaluationStatus } from "@/types/database";

export interface SubjectInput {
  name: string;
  color_hex: string;
  /** null = hereda la nota mínima global del perfil */
  min_passing_grade: number | null;
  absences_count?: number;
  max_absences?: number;
  professor?: string | null;
  resource_url?: string | null;
}

export interface NewEvaluationData {
  subject_id: string;
  title: string;
  due_date: string | null;
  weight_percentage: number;
}

export interface EvaluationPatch {
  title?: string;
  due_date?: string | null;
  weight_percentage?: number;
  max_score?: number;
  earned_score?: number | null;
  status?: EvaluationStatus;
  reminder_days?: number;
}

export interface ClassBlockInput {
  subject_id: string;
  day_of_week: number;
  start_time: string; // HH:MM
  end_time: string;
  room: string | null;
}

export interface ProfileData {
  full_name: string | null;
  default_min_passing_grade: number;
}
