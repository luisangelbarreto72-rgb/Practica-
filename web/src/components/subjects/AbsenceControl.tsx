"use client";

import type { MouseEvent } from "react";
import { AlertTriangle, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AbsenceControlProps {
  subjectName: string;
  absencesCount: number;
  maxAbsences: number;
  onChange: (nextCount: number) => void;
  variant?: "compact" | "full";
  className?: string;
}

export function AbsenceControl({
  subjectName,
  absencesCount,
  maxAbsences,
  onChange,
  variant = "compact",
  className,
}: AbsenceControlProps) {
  const remaining = maxAbsences - absencesCount;
  const isNearLimit = remaining === 1;
  const isAtOrOverLimit = remaining <= 0;

  const containerStyle = isAtOrOverLimit
    ? "border-red-500/40 bg-red-500/10"
    : isNearLimit
      ? "border-amber-500/50 bg-amber-500/10"
      : "border-border/70 bg-muted/40";

  const alertTextStyle = isAtOrOverLimit
    ? "text-red-600 dark:text-red-400"
    : "text-amber-700 dark:text-amber-400";

  const alertMessage = isAtOrOverLimit
    ? absencesCount > maxAbsences
      ? "Límite de faltas excedido"
      : "Límite de faltas alcanzado"
    : isNearLimit
      ? "A 1 falta del límite"
      : null;

  const handleDecrement = (e: MouseEvent) => {
    e.stopPropagation();
    if (absencesCount <= 0) return;
    onChange(absencesCount - 1);
  };

  const handleIncrement = (e: MouseEvent) => {
    e.stopPropagation();
    onChange(absencesCount + 1);
  };

  if (variant === "compact") {
    return (
      <div
        className={cn(
          "relative z-10 flex flex-col gap-1 rounded-md border px-2.5 py-1.5 transition-colors",
          containerStyle,
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5 text-xs">
            {(isNearLimit || isAtOrOverLimit) && (
              <AlertTriangle className={cn("size-3.5 shrink-0", alertTextStyle)} aria-hidden="true" />
            )}
            <span className="text-muted-foreground">Inasistencias:</span>
            <span
              className={cn(
                "font-semibold tabular-nums",
                isAtOrOverLimit
                  ? "text-red-600 dark:text-red-400"
                  : isNearLimit
                    ? "text-amber-700 dark:text-amber-400"
                    : "text-foreground"
              )}
            >
              {absencesCount}/{maxAbsences}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon-xs"
              className="size-6 bg-background"
              disabled={absencesCount <= 0}
              aria-label={`Restar inasistencia a ${subjectName}`}
              onClick={handleDecrement}
            >
              <Minus className="size-3" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-xs"
              className="size-6 bg-background"
              aria-label={`Sumar inasistencia a ${subjectName}`}
              onClick={handleIncrement}
            >
              <Plus className="size-3" />
            </Button>
          </div>
        </div>
        {alertMessage && (
          <p role="status" className={cn("text-[11px] font-medium leading-tight", alertTextStyle)}>
            {alertMessage}
          </p>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn("flex flex-col gap-2 rounded-lg border p-3 transition-colors", containerStyle, className)}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">Control de inasistencias</p>
          <p className="flex items-baseline gap-1.5">
            <span
              className={cn(
                "text-xl font-bold tabular-nums",
                isAtOrOverLimit
                  ? "text-red-600 dark:text-red-400"
                  : isNearLimit
                    ? "text-amber-700 dark:text-amber-400"
                    : "text-foreground"
              )}
            >
              {absencesCount}
            </span>
            <span className="text-xs text-muted-foreground">
              de {maxAbsences} {maxAbsences === 1 ? "falta permitida" : "faltas permitidas"}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="bg-background"
            disabled={absencesCount <= 0}
            aria-label={`Restar inasistencia a ${subjectName}`}
            onClick={handleDecrement}
          >
            <Minus className="size-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="bg-background"
            aria-label={`Sumar inasistencia a ${subjectName}`}
            onClick={handleIncrement}
          >
            <Plus className="size-4" />
          </Button>
        </div>
      </div>

      {alertMessage ? (
        <p role="status" className={cn("flex items-center gap-1.5 text-xs font-medium", alertTextStyle)}>
          <AlertTriangle className="size-3.5 shrink-0" aria-hidden="true" />
          <span>{alertMessage}</span>
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Te {remaining === 1 ? "queda 1 falta disponible" : `quedan ${remaining} faltas disponibles`} antes del límite.
        </p>
      )}
    </div>
  );
}
