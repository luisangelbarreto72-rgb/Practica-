"use client";

import Link from "next/link";
import { FlaskConical, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SubjectMetrics } from "@/lib/academic-math";

interface SubjectCardProps {
  metrics: SubjectMetrics;
  onSimulate: () => void;
  /** Cantidad de evaluaciones registradas (pendientes y calificadas) */
  evaluationCount?: number;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function SubjectCard({ metrics, onSimulate, evaluationCount, onEdit, onDelete }: SubjectCardProps) {
  const { subject, earnedPoints, evaluatedWeight, minPassingGrade, pointsNeededToPass, isPassing } = metrics;
  const clampedPoints = Math.min(100, Math.max(0, earnedPoints));

  return (
    <Card className="relative border border-border/80 bg-card shadow-sm ring-0 transition-all duration-200 hover:-translate-y-0.5 hover:border-border hover:shadow-md">
      <CardHeader className="pb-0">
        <CardTitle className="flex min-w-0 items-center gap-2.5 text-base font-semibold tracking-tight">
          <span
            className="size-2.5 shrink-0 rounded-full ring-2 ring-background"
            style={{ backgroundColor: subject.color_hex }}
          />
          {/* Enlace estirado: toda la tarjeta navega a la página de la materia */}
          <Link
            href={`/subjects/${subject.id}`}
            className="truncate outline-none after:absolute after:inset-0 after:rounded-[inherit] focus-visible:after:ring-2 focus-visible:after:ring-ring"
          >
            {subject.name}
          </Link>
        </CardTitle>
        {(onEdit || onDelete) && (
          <div className="relative z-10 col-start-2 row-span-2 row-start-1 flex gap-0.5 self-start justify-self-end transition-opacity sm:opacity-0 sm:group-hover/card:opacity-100 sm:focus-within:opacity-100">
            {onEdit && (
              <Button
                variant="ghost"
                size="icon-xs"
                className="text-muted-foreground hover:text-foreground"
                aria-label={`Editar ${subject.name}`}
                onClick={onEdit}
              >
                <Pencil className="size-3.5" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon-xs"
                className="text-muted-foreground hover:text-destructive"
                aria-label={`Eliminar ${subject.name}`}
                onClick={onDelete}
              >
                <Trash2 className="size-3.5" />
              </Button>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3.5">
        <div className="flex items-baseline justify-between gap-2">
          <p className="font-heading text-3xl font-bold tracking-tight tabular-nums">
            {earnedPoints}
            <span className="text-sm font-normal text-muted-foreground"> / 100</span>
          </p>
          <span className="text-xs font-medium text-muted-foreground tabular-nums">
            {evaluatedWeight}% evaluado
          </span>
        </div>

        {/* Barra de progreso limpia con marcador sutil en la nota mínima aprobatoria */}
        <div
          className="relative py-1"
          role="progressbar"
          aria-label={`Progreso de ${subject.name}`}
          aria-valuenow={clampedPoints}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted/80">
            <div
              className="h-full rounded-full transition-[width] duration-500 ease-out"
              style={{
                width: `${clampedPoints}%`,
                backgroundColor: isPassing ? "#10b981" : subject.color_hex,
              }}
            />
          </div>
          <div
            className="absolute top-0.5 h-3 w-0.5 -translate-x-1/2 rounded-full bg-foreground/45"
            style={{ left: `${Math.min(100, Math.max(0, minPassingGrade))}%` }}
            title={`Nota mínima: ${minPassingGrade}`}
          />
        </div>

        {/* Contexto: distingue una nota baja de una materia sin notas cargadas */}
        <div className="flex flex-col gap-1">
          <p
            className={
              isPassing
                ? "text-xs font-medium text-emerald-600 dark:text-emerald-400"
                : "text-xs text-muted-foreground tabular-nums"
            }
          >
            {isPassing
              ? "Nota mínima alcanzada"
              : `Faltan ${pointsNeededToPass} pts para aprobar (mín. ${minPassingGrade})`}
          </p>
          {evaluationCount !== undefined && (
            <p className="text-[11px] text-muted-foreground/80 tabular-nums">
              {evaluationCount} {evaluationCount === 1 ? "evaluación registrada" : "evaluaciones registradas"}
            </p>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          className="relative z-10 mt-auto w-full gap-1.5 border-border/80 bg-background/60 text-xs font-medium hover:bg-accent"
          onClick={onSimulate}
        >
          <FlaskConical className="size-3.5 text-muted-foreground" /> Simulador de notas
        </Button>
      </CardContent>
    </Card>
  );
}
