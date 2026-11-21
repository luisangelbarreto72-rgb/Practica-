"use client";

import { useState } from "react";
import { CalendarDays, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { UpcomingEvaluationItem } from "@/lib/academic-math";
import { cn } from "@/lib/utils";
import type { Evaluation } from "@/types/database";

function urgencyLabel(days: number): string {
  if (days < 0) return `Vencida (${Math.abs(days)}d)`;
  if (days === 0) return "Hoy";
  if (days === 1) return "Mañana";
  return `En ${days} días`;
}

function urgencyClass(days: number): string {
  if (days <= 1) return "bg-red-500/15 text-red-600 dark:text-red-400";
  if (days <= 3) return "bg-amber-500/15 text-amber-600 dark:text-amber-400";
  return "bg-muted text-muted-foreground";
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es", { day: "numeric", month: "short" });
}

interface UpcomingEvaluationsWidgetProps {
  items: UpcomingEvaluationItem[];
  limit?: number;
  onAdd?: () => void;
  /** Se llama al pulsar una evaluación de la lista (p. ej. para calificarla). */
  onSelect?: (evaluation: Evaluation) => void;
}

export function UpcomingEvaluationsWidget({
  items,
  limit = 4,
  onAdd,
  onSelect,
}: UpcomingEvaluationsWidgetProps) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? items : items.slice(0, limit);
  const hidden = items.length - limit;

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CalendarDays className="size-4 text-muted-foreground" />
          <h2 className="font-heading text-sm font-semibold tracking-tight">Próximas evaluaciones</h2>
          {items.length > 0 && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground tabular-nums">
              {items.length}
            </span>
          )}
        </div>
        {onAdd && (
          <Button size="sm" variant="outline" className="h-7 gap-1 px-2.5 text-xs" onClick={onAdd}>
            <Plus className="size-3.5" /> Nueva
          </Button>
        )}
      </div>

      {visible.length === 0 ? (
        <div className="flex flex-1 items-center justify-center py-8 text-center">
          <p className="text-sm text-muted-foreground">No tienes evaluaciones pendientes</p>
        </div>
      ) : (
        <ul className={cn("flex flex-col divide-y divide-border/60", expanded && "max-h-80 overflow-y-auto pr-1")}>
          {visible.map(({ evaluation, subjectName, subjectColor, daysRemaining }) => (
            <li key={evaluation.id}>
              <button
                type="button"
                onClick={() => onSelect?.(evaluation)}
                aria-label={`Calificar ${evaluation.title} de ${subjectName}`}
                className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left outline-none transition-colors hover:bg-accent/60 focus-visible:bg-accent/60 focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="h-8 w-1 shrink-0 rounded-full" style={{ backgroundColor: subjectColor }} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-foreground">{evaluation.title}</span>
                  <span className="block truncate text-xs text-muted-foreground tabular-nums">
                    {subjectName} · {formatDate(evaluation.due_date)} · {evaluation.weight_percentage}%
                  </span>
                </span>
                <Badge className={cn("shrink-0 border-0 text-[11px] font-medium tabular-nums", urgencyClass(daysRemaining))}>
                  {urgencyLabel(daysRemaining)}
                </Badge>
              </button>
            </li>
          ))}
        </ul>
      )}

      {hidden > 0 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="mt-auto self-start rounded text-xs font-medium text-muted-foreground underline underline-offset-4 outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          {expanded ? "Ver menos" : `Ver ${hidden} más`}
        </button>
      )}
    </div>
  );
}
