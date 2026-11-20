"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
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
    <li className="group flex items-center gap-2 rounded-md px-1 py-1 hover:bg-muted/60">
      <input
        type="checkbox"
        id={`task-${task.id}`}
        className="size-4 shrink-0 cursor-pointer accent-primary"
        checked={task.is_completed}
        onChange={(e) => void onToggle(task.id, e.target.checked)}
      />
      <label
        htmlFor={`task-${task.id}`}
        className={
          "min-w-0 flex-1 cursor-pointer break-words text-sm " +
          (task.is_completed ? "text-muted-foreground line-through" : "")
        }
      >
        {task.title}
      </label>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={`Eliminar tarea ${task.title}`}
        className="opacity-60 hover:opacity-100 focus-visible:opacity-100"
        onClick={() => void onDelete(task.id)}
      >
        <Trash2 className="size-4" />
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
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Tareas y recordatorios</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {error && (
          <p role="status" className="rounded-md bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
            No se pudieron cargar las tareas ({error}). Ejecuta la migración{" "}
            <code>supabase/migrations/002_tasks_and_schedule.sql</code> en Supabase.
          </p>
        )}
        <form onSubmit={submit} className="flex gap-2">
          <Input
            aria-label="Nueva tarea"
            placeholder="Ej: Estudiar guía de ejercicios"
            value={title}
            maxLength={200}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Button type="submit" size="sm" disabled={!title.trim() || saving}>
            <Plus className="size-4" /> Añadir
          </Button>
        </form>

        {pending.length === 0 && done.length === 0 ? (
          <p className="py-2 text-center text-sm text-muted-foreground">No tienes pendientes. ¡Anota el primero!</p>
        ) : pending.length === 0 ? (
          <p className="py-1 text-center text-sm text-muted-foreground">¡Todo al día! 🎉</p>
        ) : (
          <ul className="flex flex-col" aria-label="Tareas pendientes">
            {pending.map((t) => <TaskRow key={t.id} task={t} onToggle={onToggle} onDelete={onDelete} />)}
          </ul>
        )}

        {done.length > 0 && (
          <div>
            <button
              type="button"
              className="text-xs text-muted-foreground underline-offset-2 hover:underline"
              aria-expanded={showDone}
              onClick={() => setShowDone((v) => !v)}
            >
              {showDone ? "Ocultar completadas" : `Completadas (${done.length})`}
            </button>
            {showDone && (
              <ul className="mt-1 flex flex-col" aria-label="Tareas completadas">
                {done.map((t) => <TaskRow key={t.id} task={t} onToggle={onToggle} onDelete={onDelete} />)}
              </ul>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
