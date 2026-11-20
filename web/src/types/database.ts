export type ThemePreference = "light" | "dark" | "system";
export type EvaluationStatus = "pending" | "graded";

export interface Profile {
  id: string;
  full_name: string | null;
  default_min_passing_grade: number;
  theme_preference: ThemePreference;
  created_at: string;
  updated_at: string;
}

export interface Subject {
  id: string;
  user_id: string;
  name: string;
  color_hex: string;
  min_passing_grade: number | null;
  is_archived: boolean;
  created_at: string;
}

export interface Evaluation {
  id: string;
  user_id: string;
  subject_id: string;
  title: string;
  status: EvaluationStatus;
  due_date: string | null; // ISO date YYYY-MM-DD
  weight_percentage: number;
  max_score: number;
  earned_score: number | null;
  reminder_days: number;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
}

export interface ClassBlock {
  id: string;
  user_id: string;
  subject_id: string;
  day_of_week: number; // 1 = lunes … 7 = domingo
  start_time: string; // HH:MM (la BD devuelve HH:MM:SS; se normaliza al leer)
  end_time: string;
  room: string | null;
  created_at: string;
}
