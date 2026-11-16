"use client";

import Link from "next/link";
import { FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { SubjectMetrics } from "@/lib/academic-math";

interface SubjectCardProps {
  metrics: SubjectMetrics;
  onSimulate: () => void;
}

export function SubjectCard({ metrics, onSimulate }: SubjectCardProps) {
  const { subject, earnedPoints, minPassingGrade, pointsNeededToPass, isPassing } = metrics;

  return (
    <Card className="relative transition-shadow hover:ring-2 hover:ring-ring/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="size-3 rounded-full" style={{ backgroundColor: subject.color_hex }} />
          {/* Enlace estirado: toda la tarjeta navega a la página de la materia */}
          <Link
            href={`/subjects/${subject.id}`}
            className="outline-none after:absolute after:inset-0 after:rounded-[inherit] focus-visible:after:ring-2 focus-visible:after:ring-ring"
          >
            {subject.name}
          </Link>
        </CardTitle>
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

        <Button variant="secondary" size="sm" className="relative z-10 mt-1 w-full" onClick={onSimulate}>
          <FlaskConical className="size-4" /> Simulador de Notas
        </Button>
      </CardContent>
    </Card>
  );
}
