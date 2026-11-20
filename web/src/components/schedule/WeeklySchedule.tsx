"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useData } from "@/components/data-provider";
import { ConfirmDialog } from "@/components/ui-extra/ConfirmDialog";
import { ClassBlockModal, DAYS } from "@/components/schedule/ClassBlockModal";
import type { ClassBlock } from "@/types/database";

export function WeeklySchedule() {
  const { subjects, classBlocks, extrasError, addClassBlock, updateClassBlock, deleteClassBlock } = useData();
  const [modal, setModal] = useState<{ open: boolean; block: ClassBlock | null; day?: number }>({
    open: false,
    block: null,
  });
  const [deleting, setDeleting] = useState<ClassBlock | null>(null);

  const subjectById = useMemo(() => new Map(subjects.map((s) => [s.id, s])), [subjects]);
  const byDay = useMemo(
    () =>
      DAYS.map((_, i) =>
        classBlocks.filter((b) => b.day_of_week === i + 1).sort((a, b) => a.start_time.localeCompare(b.start_time))
      ),
    [classBlocks]
  );
  const todayIdx = (new Date().getDay() + 6) % 7; // lunes = 0

  if (subjects.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          Agrega primero una materia para poder armar tu horario.
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Horario semanal</h2>
        <Button size="sm" onClick={() => setModal({ open: true, block: null })}>
          <Plus className="size-4" /> Agregar clase
        </Button>
      </div>

      {extrasError && (
        <p role="status" className="rounded-md bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
          No se pudo cargar el horario ({extrasError}). Ejecuta la migración{" "}
          <code>supabase/migrations/002_tasks_and_schedule.sql</code> en Supabase.
        </p>
      )}

      {classBlocks.length === 0 && !extrasError && (
        <p className="text-sm text-muted-foreground">Aún no has registrado clases. Pulsa «Agregar clase».</p>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4 lg:grid-cols-7">
        {DAYS.map((day, i) => (
          <Card key={day} className={i === todayIdx ? "ring-2 ring-primary/40" : undefined} size="sm">
            <CardContent className="flex min-h-24 flex-col gap-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">
                  {day}
                  {i === todayIdx && <span className="ml-1 text-xs font-normal text-muted-foreground">· hoy</span>}
                </h3>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Agregar clase el ${day}`}
                  onClick={() => setModal({ open: true, block: null, day: i + 1 })}
                >
                  <Plus className="size-3.5" />
                </Button>
              </div>
              {byDay[i].length === 0 ? (
                <p className="text-xs text-muted-foreground">Sin clases</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {byDay[i].map((b) => {
                    const subject = subjectById.get(b.subject_id);
                    return (
                      <li
                        key={b.id}
                        className="rounded-md border-l-4 bg-muted/50 px-2 py-1.5 text-xs"
                        style={{ borderLeftColor: subject?.color_hex ?? "#888" }}
                      >
                        <p className="font-medium">{subject?.name ?? "Materia"}</p>
                        <p className="tabular-nums text-muted-foreground">
                          {b.start_time}–{b.end_time}
                          {b.room ? ` · ${b.room}` : ""}
                        </p>
                        <div className="mt-1 flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            aria-label={`Editar clase de ${subject?.name ?? "materia"} el ${day}`}
                            onClick={() => setModal({ open: true, block: b })}
                          >
                            <Pencil className="size-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-xs"
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
        ))}
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
