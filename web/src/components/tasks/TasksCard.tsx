"use client";

import { useState } from "react";
import { CheckSquare, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Task } from "@/types/database";

interface TasksCardProps {
  tasks: Task[];
  error?: string | null;
  onAdd: (title: string) => Promise<boolean>;
  onToggle: (id: string, completed: boolean) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}

function TaskRow({
  task,
  onToggle,
  onDelete,
}: {
  task: Task;
  onToggle: TasksCardProps["onToggle"];
  onDelete: TasksCardProps["onDelete"];
}) {
  return (
    <li className="group flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-accent/60">
      <input
        type="checkbox"
        id={`task-${task.id}`}
        className="size-4 shrink-0 cursor-pointer rounded border-border accent-primary"
        checked={task.is_completed}
        onChange={(e) => void onToggle(task.id, e.target.checked)}
      />
      <label
        htmlFor={`task-${task.id}`}
        className={
          "min-w-0 flex-1 cursor-pointer break-words text-sm leading-snug " +
          (task.is_completed ? "text-muted-foreground line-through" : "text-foreground")
        }
      >
        {task.title}
      </label>
      <Button
        variant="ghost"
        size="icon-xs"
        aria-label={`Eliminar tarea ${task.title}`}
        className="text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100 focus-visible:opacity-100"
        onClick={() => void onDelete(task.id)}
      >
        <Trash2 className="size-3.5" />
      </Button>
    </li>
  );
}

export function TasksCard({ tasks, error, onAdd, onToggle, onDelete }: TasksCardProps) {
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [showDone, setShowDone] = useState(false);

  const pending = tasks.filter((t) => !t.is_completed);
  const done = tasks.filter((t) => t.is_completed);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const t = title.trim();
    if (!t || saving) return;
    setSaving(true);
    const ok = await onAdd(t);
    setSaving(false);
    if (ok) setTitle("");
  }

  return (
    <Card className="h-full border border-border/80 shadow-sm ring-0">
      <CardHeader className="pb-0">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold tracking-tight">
          <CheckSquare className="size-4 text-muted-foreground" />
          <span>Tareas rápidas</span>
          {pending.length > 0 && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground tabular-nums">
              {pending.length}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        {error && (
          <p role="status" className="rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
            No se pudieron cargar las tareas ({error}). Ejecuta la migración{" "}
            <code>supabase/migrations/002_tasks_and_schedule.sql</code> en Supabase.
          </p>
        )}
        <form onSubmit={submit} className="flex gap-2">
          <Input
            aria-label="Nueva tarea"
            placeholder="Añadir tarea rápida…"
            value={title}
            maxLength={200}
            className="h-8 bg-background text-sm"
            onChange={(e) => setTitle(e.target.value)}
          />
          <Button type="submit" size="sm" variant="secondary" className="h-8 shrink-0 gap-1 px-3 text-xs" disabled={!title.trim() || saving}>
            <Plus className="size-3.5" /> Añadir
          </Button>
        </form>

        {pending.length === 0 && done.length === 0 ? (
          <div className="flex flex-1 items-center justify-center py-6 text-center">
            <p className="text-sm text-muted-foreground">No tienes pendientes. ¡Anota el primero!</p>
          </div>
        ) : pending.length === 0 ? (
          <div className="flex flex-1 items-center justify-center py-4 text-center">
            <p className="text-sm text-muted-foreground">¡Todo al día!</p>
          </div>
        ) : (
          <ul className="flex max-h-64 flex-col gap-0.5 overflow-y-auto pr-1" aria-label="Tareas pendientes">
            {pending.map((t) => (
              <TaskRow key={t.id} task={t} onToggle={onToggle} onDelete={onDelete} />
            ))}
          </ul>
        )}

        {done.length > 0 && (
          <div className="mt-auto border-t border-border/60 pt-2">
            <button
              type="button"
              className="text-xs font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline tabular-nums"
              aria-expanded={showDone}
              onClick={() => setShowDone((v) => !v)}
            >
              {showDone ? "Ocultar completadas" : `Completadas (${done.length})`}
            </button>
            {showDone && (
              <ul className="mt-1.5 flex max-h-40 flex-col gap-0.5 overflow-y-auto pr-1" aria-label="Tareas completadas">
                {done.map((t) => (
                  <TaskRow key={t.id} task={t} onToggle={onToggle} onDelete={onDelete} />
                ))}
              </ul>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
