import type { Evaluation, Subject } from "@/types/database";

const USER = "demo-user";
const now = new Date().toISOString();

/** Devuelve una fecha YYYY-MM-DD relativa a hoy (para que la demo siempre sea vigente). */
function daysFromToday(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export const MOCK_MIN_PASSING_GRADE = 60;

export const mockSubjects: Subject[] = [
  { id: "s1", user_id: USER, name: "Cálculo I", color_hex: "#1A5F7A", min_passing_grade: null, is_archived: false, created_at: now },
  { id: "s2", user_id: USER, name: "Física General", color_hex: "#22A39F", min_passing_grade: null, is_archived: false, created_at: now },
  { id: "s3", user_id: USER, name: "Historia Universal", color_hex: "#E07A5F", min_passing_grade: null, is_archived: false, created_at: now },
  { id: "s4", user_id: USER, name: "Programación", color_hex: "#6C63FF", min_passing_grade: null, is_archived: false, created_at: now },
];

function ev(
  id: string,
  subject_id: string,
  title: string,
  weight: number,
  opts: { due?: number; max?: number; earned?: number; reminder?: number }
): Evaluation {
  const graded = opts.earned !== undefined;
  return {
    id,
    user_id: USER,
    subject_id,
    title,
    status: graded ? "graded" : "pending",
    due_date: opts.due !== undefined ? daysFromToday(opts.due) : null,
    weight_percentage: weight,
    max_score: opts.max ?? 100,
    earned_score: graded ? opts.earned! : null,
    reminder_days: opts.reminder ?? 3,
    created_at: now,
    updated_at: now,
  };
}

export const mockEvaluations: Evaluation[] = [
  // Cálculo I → 17.5 + 22.5 = 40 pts
  ev("e1", "s1", "Quiz 1", 20, { max: 20, earned: 17.5 }),
  ev("e2", "s1", "Parcial I", 30, { max: 20, earned: 15 }),
  ev("e3", "s1", "Parcial II", 25, { due: 2 }),
  ev("e4", "s1", "Examen final", 25, { due: 20 }),
  // Física → 18 + 20 = 38 pts
  ev("e5", "s2", "Laboratorio 1", 20, { max: 10, earned: 9 }),
  ev("e6", "s2", "Parcial I", 30, { max: 100, earned: 66.67 }),
  ev("e7", "s2", "Informe de laboratorio", 15, { due: 5 }),
  ev("e8", "s2", "Examen final", 35, { due: 25 }),
  // Historia → 25 + 28 = 53 pts
  ev("e9", "s3", "Ensayo", 25, { max: 20, earned: 20 }),
  ev("e10", "s3", "Exposición", 30, { max: 20, earned: 18.67 }),
  ev("e11", "s3", "Prueba corta", 20, { due: 0, reminder: 1 }),
  ev("e12", "s3", "Examen final", 25, { due: 14 }),
  // Programación → 30 + 32 = 62 pts (aprobada)
  ev("e13", "s4", "Proyecto 1", 30, { max: 100, earned: 100 }),
  ev("e14", "s4", "Parcial", 40, { max: 100, earned: 80 }),
  ev("e15", "s4", "Proyecto final", 30, { due: 9 }),
];
