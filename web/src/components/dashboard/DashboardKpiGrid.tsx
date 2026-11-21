"use client";

import { useMemo } from "react";
import { Award, CheckCircle2, Clock, ListTodo } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ClassBlock, Subject, Task } from "@/types/database";

interface DashboardKpiGridProps {
  average: number;
  evaluatedSubjectsCount: number;
  passingCount: number;
  totalSubjects: number;
  minPassingGrade: number;
  classBlocks: ClassBlock[];
  subjects: Subject[];
  tasks: Task[];
  onOpenSchedule?: () => void;
}

export function DashboardKpiGrid({
  average,
  evaluatedSubjectsCount,
  passingCount,
  totalSubjects,
  minPassingGrade,
  classBlocks,
  subjects,
  tasks,
  onOpenSchedule,
}: DashboardKpiGridProps) {
  const hasEvaluated = evaluatedSubjectsCount > 0;
  const isAveragePassing = hasEvaluated && average >= minPassingGrade;

  const { nextClass, isOngoing, hadClassesToday } = useMemo(() => {
    const now = new Date();
    const todayDayOfWeek = ((now.getDay() + 6) % 7) + 1; // 1 = lunes … 7 = domingo
    const nowHHMM = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    const todayBlocks = classBlocks
      .filter((b) => b.day_of_week === todayDayOfWeek)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));

    const upcoming = todayBlocks.find((b) => b.end_time > nowHHMM) ?? null;
    const ongoing = upcoming ? upcoming.start_time <= nowHHMM && upcoming.end_time > nowHHMM : false;
    const subjectMap = new Map(subjects.map((s) => [s.id, s]));

    return {
      nextClass: upcoming ? { block: upcoming, subject: subjectMap.get(upcoming.subject_id) ?? null } : null,
      isOngoing: ongoing,
      hadClassesToday: todayBlocks.length > 0,
    };
  }, [classBlocks, subjects]);

  const pendingTasksCount = useMemo(() => tasks.filter((t) => !t.is_completed).length, [tasks]);
  const completedTasksCount = tasks.length - pendingTasksCount;

  const kpiCardClass =
    "flex flex-col justify-between gap-2.5 rounded-xl border border-border/80 bg-card p-4 shadow-sm transition-all duration-200 hover:border-border";

  return (
    <section aria-label="Indicadores principales" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {/* 1. Promedio Actual (>0% evaluado) */}
      <div className={kpiCardClass}>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-muted-foreground">Promedio actual</span>
          <Award className="size-4 shrink-0 text-muted-foreground/70" />
        </div>
        <div>
          <div className="flex items-baseline gap-1.5">
            <span
              className={cn(
                "font-heading text-2xl font-bold tracking-tight tabular-nums",
                hasEvaluated && (isAveragePassing ? "text-emerald-600 dark:text-emerald-400" : "text-foreground")
              )}
            >
              {hasEvaluated ? average : "—"}
            </span>
            {hasEvaluated && <span className="text-xs font-medium text-muted-foreground tabular-nums">/ 100</span>}
          </div>
          <p className="mt-1 truncate text-xs text-muted-foreground tabular-nums">
            {hasEvaluated
              ? `${evaluatedSubjectsCount} de ${totalSubjects} ${totalSubjects === 1 ? "materia evaluada" : "materias evaluadas"}`
              : "Sin materias con >0% evaluado"}
          </p>
        </div>
      </div>

      {/* 2. Materias Aprobando */}
      <div className={kpiCardClass}>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-muted-foreground">Materias aprobando</span>
          <CheckCircle2 className="size-4 shrink-0 text-muted-foreground/70" />
        </div>
        <div>
          <div className="flex items-baseline gap-1">
            <span className="font-heading text-2xl font-bold tracking-tight tabular-nums">{passingCount}</span>
            <span className="text-sm font-medium text-muted-foreground tabular-nums">/ {totalSubjects}</span>
          </div>
          <p className="mt-1 truncate text-xs text-muted-foreground tabular-nums">
            {totalSubjects > 0 && passingCount === totalSubjects
              ? "Todas sobre la nota mínima"
              : `Nota mínima: ${minPassingGrade} pts`}
          </p>
        </div>
      </div>

      {/* 3. Próxima Clase de Hoy */}
      <button
        type="button"
        onClick={onOpenSchedule}
        className={cn(
          kpiCardClass,
          "text-left outline-none hover:bg-accent/30 focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
        )}
      >
        <div className="flex w-full items-center justify-between gap-2">
          <span className="text-xs font-medium text-muted-foreground">Próxima clase de hoy</span>
          <Clock className="size-4 shrink-0 text-muted-foreground/70" />
        </div>
        <div className="min-w-0">
          {nextClass ? (
            <>
              <div className="flex items-center gap-2">
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: nextClass.subject?.color_hex ?? "#64748b" }}
                />
                <span className="truncate font-heading text-lg font-semibold leading-snug tracking-tight">
                  {nextClass.subject?.name ?? "Materia"}
                </span>
              </div>
              <p className="mt-1 truncate text-xs text-muted-foreground tabular-nums">
                {isOngoing && (
                  <span className="mr-1.5 font-medium text-emerald-600 dark:text-emerald-400">En curso ·</span>
                )}
                {nextClass.block.start_time}–{nextClass.block.end_time}
                {nextClass.block.room ? ` · ${nextClass.block.room}` : ""}
              </p>
            </>
          ) : (
            <>
              <p className="font-heading text-lg font-semibold leading-snug tracking-tight text-muted-foreground">
                {hadClassesToday ? "Finalizadas" : "Sin clases"}
              </p>
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {hadClassesToday ? "Terminaron tus clases de hoy" : "Día libre en tu horario"}
              </p>
            </>
          )}
        </div>
      </button>

      {/* 4. Tareas Pendientes */}
      <div className={kpiCardClass}>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-muted-foreground">Tareas pendientes</span>
          <ListTodo className="size-4 shrink-0 text-muted-foreground/70" />
        </div>
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-heading text-2xl font-bold tracking-tight tabular-nums">{pendingTasksCount}</span>
            <span className="text-xs text-muted-foreground">
              {pendingTasksCount === 1 ? "pendiente" : "pendientes"}
            </span>
          </div>
          <p className="mt-1 truncate text-xs text-muted-foreground tabular-nums">
            {pendingTasksCount === 0
              ? completedTasksCount > 0
                ? `Todo al día · ${completedTasksCount} completadas`
                : "Sin pendientes por ahora"
              : `${completedTasksCount} ${completedTasksCount === 1 ? "completada" : "completadas"}`}
          </p>
        </div>
      </div>
    </section>
  );
}
