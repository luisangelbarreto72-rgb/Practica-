"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { MOCK_MIN_PASSING_GRADE, mockEvaluations, mockSubjects } from "@/lib/mock-data";
import type { Evaluation, Subject } from "@/types/database";

export interface NewEvaluationData {
  subject_id: string;
  title: string;
  due_date: string;
  weight_percentage: number;
}

interface DataContextValue {
  subjects: Subject[];
  evaluations: Evaluation[];
  minPassingGrade: number;
  addEvaluation: (data: NewEvaluationData) => void;
  /** Convierte una evaluación pendiente en calificada con su nota. */
  gradeEvaluation: (id: string, earnedScore: number, maxScore: number) => void;
}

const DataContext = createContext<DataContextValue | null>(null);

/**
 * Estado temporal en memoria con los datos de prueba, compartido entre el Dashboard
 * y /subjects/[id] durante la navegación. Se sustituirá por Supabase.
 */
export function DataProvider({ children }: { children: ReactNode }) {
  const [evaluations, setEvaluations] = useState<Evaluation[]>(mockEvaluations);

  const addEvaluation = useCallback((data: NewEvaluationData) => {
    const now = new Date().toISOString();
    setEvaluations((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        user_id: "demo-user",
        status: "pending",
        max_score: 100,
        earned_score: null,
        reminder_days: 3,
        created_at: now,
        updated_at: now,
        ...data,
      },
    ]);
  }, []);

  const gradeEvaluation = useCallback((id: string, earnedScore: number, maxScore: number) => {
    setEvaluations((prev) =>
      prev.map((e) =>
        e.id === id
          ? {
              ...e,
              status: "graded",
              earned_score: earnedScore,
              max_score: maxScore,
              updated_at: new Date().toISOString(),
            }
          : e
      )
    );
  }, []);

  const value = useMemo(
    () => ({
      subjects: mockSubjects,
      evaluations,
      minPassingGrade: MOCK_MIN_PASSING_GRADE,
      addEvaluation,
      gradeEvaluation,
    }),
    [evaluations, addEvaluation, gradeEvaluation]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData debe usarse dentro de <DataProvider>");
  return ctx;
}
