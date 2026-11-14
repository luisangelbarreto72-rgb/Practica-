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
