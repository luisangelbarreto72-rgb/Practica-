"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Subject } from "@/types/database";

export interface NewEvaluationInput {
  subject_id: string;
  title: string;
  due_date: string;
  weight_percentage: number;
}

const inputClass =
  "h-9 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

interface EvaluationFormModalProps {
  open: boolean;
  subjects: Subject[];
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: NewEvaluationInput) => void;
}

export function EvaluationFormModal({ open, subjects, onOpenChange, onSubmit }: EvaluationFormModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {/* Se remonta al abrir para limpiar el formulario */}
        {open && <Form subjects={subjects} onCancel={() => onOpenChange(false)} onSubmit={onSubmit} />}
      </DialogContent>
    </Dialog>
  );
}

function Form({
  subjects,
  onCancel,
  onSubmit,
}: {
  subjects: Subject[];
  onCancel: () => void;
  onSubmit: (input: NewEvaluationInput) => void;
}) {
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [weight, setWeight] = useState("");

  const w = parseFloat(weight);
  const valid = subjectId && title.trim() && dueDate && w > 0 && w <= 100;

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid) return;
        onSubmit({ subject_id: subjectId, title: title.trim(), due_date: dueDate, weight_percentage: w });
      }}
    >
      <DialogHeader>
        <DialogTitle>Nueva evaluación</DialogTitle>
        <DialogDescription>Registra una evaluación pendiente para una de tus materias.</DialogDescription>
      </DialogHeader>

      <label className="text-sm">
        Materia
        <select className={inputClass} value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm">
        Título
        <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Parcial II" autoFocus />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm">
          Fecha
          <input className={inputClass} type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </label>
        <label className="text-sm">
          Peso (%)
          <input className={inputClass} type="number" inputMode="decimal" min={1} max={100} value={weight} onChange={(e) => setWeight(e.target.value)} />
        </label>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={!valid}>
          Guardar
        </Button>
      </DialogFooter>
    </form>
  );
}
