"use client";

import { CalendarDays, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { UpcomingEvaluationItem } from "@/lib/academic-math";
import { cn } from "@/lib/utils";

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
}

export function UpcomingEvaluationsWidget({
  items,
  limit = 4,
  onAdd,
}: UpcomingEvaluationsWidgetProps) {
  const visible = items.slice(0, limit);
  const hidden = items.length - visible.length;

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <CalendarDays className="size-4" /> Próximas evaluaciones
        </h2>
        {onAdd && (
          <Button size="sm" onClick={onAdd}>
            <Plus className="size-4" /> Nueva
          </Button>
        )}
      </div>

      {visible.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No tienes evaluaciones pendientes 🎉
        </p>
      ) : (
        <ul className="flex flex-col divide-y">
          {visible.map(({ evaluation, subjectName, subjectColor, daysRemaining }) => (
            <li key={evaluation.id} className="flex items-center gap-3 py-2.5">
              <span
                className="h-9 w-1 shrink-0 rounded-full"
                style={{ backgroundColor: subjectColor }}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{evaluation.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {subjectName} · {formatDate(evaluation.due_date)} · {evaluation.weight_percentage}%
                </p>
              </div>
              <Badge className={cn("shrink-0 border-0", urgencyClass(daysRemaining))}>
                {urgencyLabel(daysRemaining)}
              </Badge>
            </li>
          ))}
        </ul>
      )}

      {hidden > 0 && (
        <p className="mt-auto text-xs text-muted-foreground">
          +{hidden} más
        </p>
      )}
    </div>
  );
}
