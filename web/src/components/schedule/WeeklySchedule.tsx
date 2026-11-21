"use client";

import { useMemo, useState } from "react";
import { Calendar, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useData } from "@/components/data-provider";
import { ConfirmDialog } from "@/components/ui-extra/ConfirmDialog";
import { ClassBlockModal, DAYS } from "@/components/schedule/ClassBlockModal";
import { cn } from "@/lib/utils";
import type { ClassBlock } from "@/types/database";

export function WeeklySchedule() {
  const { subjects, classBlocks, extrasError, addClassBlock, updateClassBlock, deleteClassBlock } = useData();
  const [modal, setModal] = useState<{ open: boolean; block: ClassBlock | null; day?: number }>({
    open: false,
    block: null,
  });
  const [deleting, setDeleting] = useState<ClassBlock | null>(null);
  const [showSunday, setShowSunday] = useState(false);

  const subjectById = useMemo(() => new Map(subjects.map((s) => [s.id, s])), [subjects]);
  const byDay = useMemo(
    () =>
      DAYS.map((_, i) =>
        classBlocks.filter((b) => b.day_of_week === i + 1).sort((a, b) => a.start_time.localeCompare(b.start_time))
      ),
    [classBlocks]
  );
  const todayIdx = (new Date().getDay() + 6) % 7; // lunes = 0
  const sundayCount = byDay[6]?.length ?? 0;
  const visibleDays = showSunday ? DAYS : DAYS.slice(0, 6);

  if (subjects.length === 0) {
    return (
      <Card className="border border-border/80 shadow-sm ring-0">
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          Agrega primero una materia para poder armar tu horario.
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-heading text-lg font-semibold tracking-tight">Horario semanal</h2>
          <p className="text-xs text-muted-foreground">
            {showSunday ? "Lunes a domingo" : "Lunes a sábado"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            aria-pressed={showSunday}
            onClick={() => setShowSunday((v) => !v)}
          >
            <Calendar className="size-3.5 text-muted-foreground" />
            {showSunday
              ? "Ocultar domingo"
              : sundayCount > 0
                ? `Mostrar domingo (${sundayCount})`
                : "Mostrar domingo"}
          </Button>
          <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={() => setModal({ open: true, block: null })}>
            <Plus className="size-3.5" /> Agregar clase
          </Button>
        </div>
      </div>

      {extrasError && (
        <p role="status" className="rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
          No se pudo cargar el horario ({extrasError}). Ejecuta la migración{" "}
          <code>supabase/migrations/002_tasks_and_schedule.sql</code> en Supabase.
        </p>
      )}

      {classBlocks.length === 0 && !extrasError && (
        <p className="text-sm text-muted-foreground">Aún no has registrado clases. Pulsa «Agregar clase».</p>
      )}

      <div
        className={cn(
          "grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3",
          showSunday ? "lg:grid-cols-7" : "lg:grid-cols-6"
        )}
      >
        {visibleDays.map((day, i) => {
          const isToday = i === todayIdx;
          return (
            <Card
              key={day}
              size="sm"
              className={cn(
                "border shadow-sm ring-0 transition-colors",
                isToday ? "border-foreground/25 bg-card" : "border-border/80 bg-card/80"
              )}
            >
              <CardContent className="flex min-h-32 flex-col gap-2.5">
                <div className="flex items-center justify-between border-b border-border/60 pb-2">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-heading text-xs font-semibold tracking-tight text-foreground">{day}</h3>
                    {isToday && (
                      <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-medium leading-none text-primary-foreground">
                        Hoy
                      </span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="text-muted-foreground hover:text-foreground"
                    aria-label={`Agregar clase el ${day}`}
                    onClick={() => setModal({ open: true, block: null, day: i + 1 })}
                  >
                    <Plus className="size-3.5" />
                  </Button>
                </div>
                {byDay[i].length === 0 ? (
                  <p className="py-4 text-center text-xs text-muted-foreground/70">Sin clases</p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {byDay[i].map((b) => {
                      const subject = subjectById.get(b.subject_id);
                      const color = subject?.color_hex ?? "#64748b";
                      return (
                        <li
                          key={b.id}
                          className="group/block relative rounded-lg border border-l-[3px] px-2.5 py-2 text-xs transition-all duration-150 hover:shadow-xs"
                          style={{
                            borderColor: `color-mix(in srgb, ${color} 22%, transparent)`,
                            borderLeftColor: color,
                            backgroundColor: `color-mix(in srgb, ${color} 10%, var(--card))`,
                          }}
                        >
                          <div className="pr-1">
                            <p className="truncate font-medium text-foreground">{subject?.name ?? "Materia"}</p>
                            <p className="mt-0.5 tabular-nums text-[11px] text-muted-foreground">
                              {b.start_time}–{b.end_time}
                            </p>
                            {b.room && (
                              <p className="mt-0.5 truncate text-[11px] text-muted-foreground/90">{b.room}</p>
                            )}
                          </div>
                          <div className="pointer-events-none absolute top-1.5 right-1.5 flex items-center gap-0.5 rounded-md bg-background/90 p-0.5 opacity-0 shadow-xs backdrop-blur-xs transition-opacity group-hover/block:pointer-events-auto group-hover/block:opacity-100 focus-within:pointer-events-auto focus-within:opacity-100">
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              className="size-5 text-muted-foreground hover:text-foreground"
                              aria-label={`Editar clase de ${subject?.name ?? "materia"} el ${day}`}
                              onClick={() => setModal({ open: true, block: b })}
                            >
                              <Pencil className="size-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              className="size-5 text-muted-foreground hover:text-destructive"
                              aria-label={`Eliminar clase de ${subject?.name ?? "materia"} el ${day}`}
                              onClick={() => setDeleting(b)}
                            >
                              <Trash2 className="size-3" />
                            </Button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <ClassBlockModal
        open={modal.open}
        subjects={subjects}
        block={modal.block}
        defaultDay={modal.day}
        onOpenChange={(open) => setModal((m) => ({ ...m, open }))}
        onSubmit={async (input) => {
          const editing = modal.block;
          const ok = editing ? await updateClassBlock(editing.id, input) : await addClassBlock(input);
          if (ok) {
            setModal({ open: false, block: null });
            toast.success(editing ? "Clase actualizada" : "Clase agregada");
          }
        }}
      />

      <ConfirmDialog
        open={deleting !== null}
        title="¿Eliminar esta clase?"
        description="Se quitará de tu horario semanal."
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return;
          const ok = await deleteClassBlock(deleting.id);
          if (ok) toast.success("Clase eliminada");
          setDeleting(null);
        }}
      />
    </section>
  );
}
