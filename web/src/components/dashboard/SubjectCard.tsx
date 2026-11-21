"use client";

import { FlaskConical, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AbsenceControl } from "@/components/subjects/AbsenceControl";
import type { SubjectMetrics } from "@/lib/academic-math";

interface SubjectCardProps {
  metrics: SubjectMetrics;
  onOpenDetail: () => void;
  onSimulate: () => void;
  onUpdateAbsences: (nextCount: number) => void;
  /** Cantidad de evaluaciones registradas (pendientes y calificadas) */
  evaluationCount?: number;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function SubjectCard({
  metrics,
  onOpenDetail,
  onSimulate,
  onUpdateAbsences,
  evaluationCount,
  onEdit,
  onDelete,
}: SubjectCardProps) {
  const { subject, earnedPoints, evaluatedWeight, minPassingGrade, pointsNeededToPass, isPassing } = metrics;

  return (
    <Card className="relative cursor-pointer transition-shadow hover:ring-2 hover:ring-ring/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: subject.color_hex }} />
          {/* Botón estirado: toda la tarjeta abre el panel lateral de detalle */}
          <button
            type="button"
            onClick={onOpenDetail}
            className="truncate text-left outline-none after:absolute after:inset-0 after:rounded-[inherit] focus-visible:after:ring-2 focus-visible:after:ring-ring"
          >
            {subject.name}
          </button>
        </CardTitle>
        {(onEdit || onDelete) && (
          <div className="relative z-10 col-start-2 row-span-2 row-start-1 flex gap-1 self-start justify-self-end">
            {onEdit && (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Editar ${subject.name}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
              >
                <Pencil className="size-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Eliminar ${subject.name}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <Trash2 className="size-4" />
              </Button>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-3xl font-bold tabular-nums">
          {earnedPoints}
          <span className="text-sm font-normal text-muted-foreground"> / 100</span>
        </p>

        {/* Barra de progreso con marcador en la nota mínima aprobatoria */}
        <div className="relative pt-1">
          <Progress value={Math.min(100, earnedPoints)} aria-label={`Progreso de ${subject.name}`} />
          <div
            className="absolute top-0 h-3 w-0.5 bg-foreground/60"
            style={{ left: `${minPassingGrade}%` }}
            title={`Nota mínima: ${minPassingGrade}`}
          />
        </div>

        {/* Contexto: distingue una nota baja de una materia sin notas cargadas */}
        <p className="flex flex-wrap justify-between gap-x-3 text-xs text-muted-foreground">
          <span>Evaluado: {evaluatedWeight}% de 100%</span>
          {evaluationCount !== undefined && (
            <span>
              {evaluationCount} {evaluationCount === 1 ? "evaluación" : "evaluaciones"}
            </span>
          )}
        </p>

        <p
          className={
            isPassing
              ? "text-sm font-medium text-emerald-600 dark:text-emerald-400"
              : "text-sm text-muted-foreground"
          }
        >
          {isPassing
            ? "¡Ya alcanzaste la nota mínima!"
            : `Te faltan ${pointsNeededToPass} pts para aprobar (mín. ${minPassingGrade})`}
        </p>

        {/* Mini-control rápido de inasistencias (- / +) con alerta visual */}
        <AbsenceControl
          subjectName={subject.name}
          absencesCount={subject.absences_count}
          maxAbsences={subject.max_absences}
          onChange={onUpdateAbsences}
          variant="compact"
        />

        <Button
          variant="secondary"
          size="sm"
          className="relative z-10 mt-1 w-full"
          onClick={(e) => {
            e.stopPropagation();
            onSimulate();
          }}
        >
          <FlaskConical className="size-4" /> Simulador de Notas
        </Button>
      </CardContent>
    </Card>
  );
}
