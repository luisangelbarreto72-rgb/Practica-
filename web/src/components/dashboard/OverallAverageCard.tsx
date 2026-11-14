"use client";

import { cn } from "@/lib/utils";

interface OverallAverageCardProps {
  average: number;
  passingCount: number;
  totalSubjects: number;
  minPassingGrade: number;
}

const SIZE = 168;
const STROKE = 16;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function OverallAverageCard({
  average,
  passingCount,
  totalSubjects,
  minPassingGrade,
}: OverallAverageCardProps) {
  const pct = Math.min(100, Math.max(0, average));
  const offset = CIRCUMFERENCE * (1 - pct / 100);
  const passing = average >= minPassingGrade;

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="-rotate-90"
          role="img"
          aria-label={`Promedio general ${average} de 100`}
        >
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            strokeWidth={STROKE}
            className="stroke-muted"
          />
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            className={cn(
              "transition-[stroke-dashoffset] duration-700",
              passing ? "stroke-emerald-500" : "stroke-amber-500"
            )}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold tabular-nums">{average}</span>
          <span className="text-xs text-muted-foreground">de 100</span>
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-muted-foreground">Promedio General</p>
        <p className="mt-1 text-sm">
          <span className="font-semibold">{passingCount}</span> de{" "}
          <span className="font-semibold">{totalSubjects}</span> materias aprobando
        </p>
        <p className="text-xs text-muted-foreground">Nota mínima: {minPassingGrade}</p>
      </div>
    </div>
  );
}
