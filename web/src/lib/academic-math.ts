import type { Evaluation, Subject } from "@/types/database";

export interface SubjectMetrics {
  subject: Subject;
  earnedPoints: number;
  evaluatedWeight: number;
  remainingWeight: number;
  minPassingGrade: number;
  pointsNeededToPass: number;
  isPassing: boolean;
  progressPercentage: number;
  nextPendingEvaluation: Evaluation | null;
}

export interface UpcomingEvaluationItem {
  evaluation: Evaluation;
  subjectName: string;
  subjectColor: string;
  daysRemaining: number;
  isWithinReminderWindow: boolean;
}

export interface SimulatedEvaluationInput {
  id: string;
  title?: string;
  score: number;
  maxScore: number;
  weightPercentage: number;
}

export interface SimulationResult {
  simulatedAddedPoints: number;
  projectedTotal: number;
  minPassingGrade: number;
  pointsNeededToPass: number;
  wouldPass: boolean;
}

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Calcula los puntos aportados sobre 100 para una evaluación individual.
 * Fórmula equivalente a (nota / maxima) * peso del simulador y evaluaciones en core.py.
 */
export function calculateEvaluationPoints(
  earnedScore: number,
  maxScore: number,
  weightPercentage: number
): number {
  if (maxScore <= 0 || weightPercentage <= 0 || earnedScore < 0) {
    return 0;
  }
  const clampedScore = Math.min(earnedScore, maxScore);
  return round2((clampedScore / maxScore) * weightPercentage);
}

/**
 * Calcula las métricas completas de una materia a partir de sus evaluaciones unificadas.
 */
export function calculateSubjectMetrics(
  subject: Subject,
  evaluations: Evaluation[],
  defaultMinPassingGrade = 60
): SubjectMetrics {
  const subjectEvaluations = evaluations.filter(
    (ev) => ev.subject_id === subject.id
  );

  const graded = subjectEvaluations.filter(
    (ev) => ev.status === "graded" && ev.earned_score !== null
  );

  const earnedPoints = round2(
    graded.reduce(
      (sum, ev) =>
        sum +
        calculateEvaluationPoints(
          ev.earned_score ?? 0,
          ev.max_score,
          ev.weight_percentage
        ),
      0
    )
  );

  const evaluatedWeight = round2(
    graded.reduce((sum, ev) => sum + ev.weight_percentage, 0)
  );

  const remainingWeight = round2(Math.max(0, 100 - evaluatedWeight));
  const minPassingGrade = subject.min_passing_grade ?? defaultMinPassingGrade;
  const pointsNeededToPass = round2(Math.max(0, minPassingGrade - earnedPoints));
  const isPassing = earnedPoints >= minPassingGrade;
  const progressPercentage = Math.min(100, Math.max(0, earnedPoints));

  const nextPendingEvaluation =
    subjectEvaluations
      .filter((ev) => ev.status === "pending" && ev.due_date !== null)
      .sort((a, b) => (a.due_date ?? "").localeCompare(b.due_date ?? ""))[0] ??
    null;

  return {
    subject,
    earnedPoints,
    evaluatedWeight,
    remainingWeight,
    minPassingGrade,
    pointsNeededToPass,
    isPassing,
    progressPercentage,
    nextPendingEvaluation,
  };
}

/**
 * Calcula el promedio actual redondeado a 2 decimales considerando únicamente
 * las materias que ya tienen al menos un porcentaje (> 0%) evaluado.
 */
export function calculateOverallAverage(
  subjectsMetrics: Pick<SubjectMetrics, "earnedPoints" | "evaluatedWeight">[]
): number {
  const evaluated = subjectsMetrics.filter((m) => m.evaluatedWeight > 0);
  if (evaluated.length === 0) {
    return 0;
  }
  const total = evaluated.reduce((sum, m) => sum + m.earnedPoints, 0);
  return round2(total / evaluated.length);
}

/**
 * Filtra y ordena cronológicamente todas las evaluaciones pendientes
 * para el widget del Dashboard y la vista de Calendario.
 */
export function getUpcomingEvaluations(
  evaluations: Evaluation[],
  subjects: Subject[],
  referenceDate: Date = new Date()
): UpcomingEvaluationItem[] {
  const subjectMap = new Map(subjects.map((s) => [s.id, s]));
  const todayStart = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  );

  return evaluations
    .filter((ev) => ev.status === "pending" && ev.due_date !== null)
    .map((ev) => {
      const subject = subjectMap.get(ev.subject_id);
      const [year, month, day] = (ev.due_date ?? "").split("-").map(Number);
      const dueDate = new Date(year, (month ?? 1) - 1, day ?? 1);
      const diffMs = dueDate.getTime() - todayStart.getTime();
      const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      return {
        evaluation: ev,
        subjectName: subject?.name ?? "Materia",
        subjectColor: subject?.color_hex ?? "#042940",
        daysRemaining,
        isWithinReminderWindow:
          daysRemaining >= 0 && daysRemaining <= ev.reminder_days,
      };
    })
    .sort((a, b) => a.daysRemaining - b.daysRemaining);
}

/**
 * Lógica pura del Simulador de Notas (migrada desde abrir_simulador en main.py).
 */
export function simulateSubjectGrade(
  currentEarnedPoints: number,
  simulatedItems: SimulatedEvaluationInput[],
  minPassingGrade = 60
): SimulationResult {
  const simulatedAddedPoints = round2(
    simulatedItems.reduce(
      (sum, item) =>
        sum +
        calculateEvaluationPoints(
          item.score,
          item.maxScore,
          item.weightPercentage
        ),
      0
    )
  );

  const projectedTotal = round2(currentEarnedPoints + simulatedAddedPoints);
  const pointsNeededToPass = round2(
    Math.max(0, minPassingGrade - projectedTotal)
  );

  return {
    simulatedAddedPoints,
    projectedTotal,
    minPassingGrade,
    pointsNeededToPass,
    wouldPass: projectedTotal >= minPassingGrade,
  };
}
