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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { NewEvaluationData } from "@/lib/data/types";
import type { Evaluation, Subject } from "@/types/database";

export type NewEvaluationInput = NewEvaluationData;

const selectClass =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

interface EvaluationFormModalProps {
  open: boolean;
  subjects: Subject[];
  /** Evaluaciones existentes: se usan para avisar si el peso total supera 100%. */
  evaluations: Evaluation[];
  /** Si se pasa, el formulario edita esa evaluación (título, fecha y peso). */
  evaluation?: Evaluation | null;
  /** Materia preseleccionada (y bloqueada si `lockSubject`). */
  defaultSubjectId?: string;
  lockSubject?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: NewEvaluationInput) => void | Promise<void>;
}

export function EvaluationFormModal({ open, onOpenChange, ...rest }: EvaluationFormModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {/* Se monta solo al abrir, así el formulario siempre empieza limpio */}
        {open && <Form onCancel={() => onOpenChange(false)} {...rest} />}
      </DialogContent>
    </Dialog>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="text-xs text-red-600 dark:text-red-400">
      {message}
    </p>
  );
}

function Form({
  subjects,
  evaluations,
  evaluation,
  defaultSubjectId,
  lockSubject,
  onCancel,
  onSubmit,
}: Omit<EvaluationFormModalProps, "open" | "onOpenChange"> & { onCancel: () => void }) {
  const editing = Boolean(evaluation);
  // Una evaluación ya calificada puede no tener fecha; las pendientes sí la necesitan.
  const dateRequired = !evaluation || evaluation.status === "pending";

  const [subjectId, setSubjectId] = useState(evaluation?.subject_id ?? defaultSubjectId ?? subjects[0]?.id ?? "");
  const [title, setTitle] = useState(evaluation?.title ?? "");
  const [dueDate, setDueDate] = useState(evaluation?.due_date ?? "");
  const [weight, setWeight] = useState(evaluation ? String(evaluation.weight_percentage) : "");
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  const w = parseFloat(weight);
  const errors = {
    title: title.trim() ? undefined : "Escribe un título para la evaluación.",
    dueDate: !dateRequired || dueDate ? undefined : "Elige una fecha.",
    weight:
      weight.trim() === ""
        ? "Indica el peso sobre la nota final."
        : !(w > 0 && w <= 100)
          ? "El peso debe estar entre 1 y 100."
          : undefined,
  };
  const hasErrors = Boolean(errors.title || errors.dueDate || errors.weight);
  const show = (field: keyof typeof errors) => (submitted ? errors[field] : undefined);

  // Peso ya usado por las demás evaluaciones de la materia (sin contar la que se edita)
  const currentWeight = evaluations
    .filter((e) => e.subject_id === subjectId && e.id !== evaluation?.id)
    .reduce((sum, e) => sum + e.weight_percentage, 0);
  const overweight = w > 0 && currentWeight + w > 100;

  function invalidClass(field: keyof typeof errors) {
    return show(field) ? "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/30" : "";
  }

  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setSubmitted(true);
        if (hasErrors || !subjectId) return;
        setSaving(true);
        try {
          await onSubmit({
            subject_id: subjectId,
            title: title.trim(),
            due_date: dueDate || null,
            weight_percentage: w,
          });
        } finally {
          setSaving(false);
        }
      }}
    >
      <DialogHeader>
        <DialogTitle>{editing ? "Editar evaluación" : "Agregar nueva evaluación"}</DialogTitle>
        <DialogDescription>
          {editing ? "Cambia el título, la fecha o el peso." : "Registra una evaluación pendiente para tu calendario."}
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="eval-subject">Materia</Label>
        <select
          id="eval-subject"
          className={selectClass}
          value={subjectId}
          disabled={lockSubject || editing}
          onChange={(e) => setSubjectId(e.target.value)}
        >
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="eval-title">Título</Label>
        <Input
          id="eval-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ej: Parcial II"
          aria-invalid={Boolean(show("title"))}
          aria-describedby="eval-title-error"
          className={invalidClass("title")}
          autoFocus
        />
        <FieldError id="eval-title-error" message={show("title")} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="eval-date">Fecha</Label>
          <Input
            id="eval-date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            aria-invalid={Boolean(show("dueDate"))}
            aria-describedby="eval-date-error"
            className={invalidClass("dueDate")}
          />
          <FieldError id="eval-date-error" message={show("dueDate")} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="eval-weight">Peso (%)</Label>
          <Input
            id="eval-weight"
            type="number"
            inputMode="decimal"
            min={1}
            max={100}
            step="any"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            aria-invalid={Boolean(show("weight"))}
            aria-describedby="eval-weight-error"
            className={invalidClass("weight")}
          />
          <FieldError id="eval-weight-error" message={show("weight")} />
        </div>
      </div>

      {overweight && (
        <p className="rounded-md bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
          Ojo: las demás evaluaciones de esta materia ya suman {currentWeight}%; con esta pasaría de 100%.
        </p>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          Cancelar
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Guardando…" : "Guardar"}
        </Button>
      </DialogFooter>
    </form>
  );
}
