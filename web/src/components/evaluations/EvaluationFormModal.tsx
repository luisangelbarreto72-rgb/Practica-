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
import type { NewEvaluationData } from "@/components/data-provider";
import { cn } from "@/lib/utils";
import type { Evaluation, Subject } from "@/types/database";

export type NewEvaluationInput = NewEvaluationData;

const selectClass =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

interface EvaluationFormModalProps {
  open: boolean;
  subjects: Subject[];
  /** Evaluaciones existentes: se usan para avisar si el peso total supera 100%. */
  evaluations: Evaluation[];
  /** Materia preseleccionada (y bloqueada si `lockSubject`). */
  defaultSubjectId?: string;
  lockSubject?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: NewEvaluationInput) => void;
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
  defaultSubjectId,
  lockSubject,
  onCancel,
  onSubmit,
}: Omit<EvaluationFormModalProps, "open" | "onOpenChange"> & { onCancel: () => void }) {
  const [subjectId, setSubjectId] = useState(defaultSubjectId ?? subjects[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [weight, setWeight] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const w = parseFloat(weight);
  const errors = {
    title: title.trim() ? undefined : "Escribe un título para la evaluación.",
    dueDate: dueDate ? undefined : "Elige una fecha.",
    weight:
      weight.trim() === ""
        ? "Indica el peso sobre la nota final."
        : !(w > 0 && w <= 100)
          ? "El peso debe estar entre 1 y 100."
          : undefined,
  };
  const hasErrors = Boolean(errors.title || errors.dueDate || errors.weight);
  const show = (field: keyof typeof errors) => (submitted ? errors[field] : undefined);

  const currentWeight = evaluations
    .filter((e) => e.subject_id === subjectId)
    .reduce((sum, e) => sum + e.weight_percentage, 0);
  const overweight = w > 0 && currentWeight + w > 100;

  function invalidClass(field: keyof typeof errors) {
    return show(field) ? "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/30" : "";
  }

  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(true);
        if (hasErrors || !subjectId) return;
        onSubmit({ subject_id: subjectId, title: title.trim(), due_date: dueDate, weight_percentage: w });
      }}
    >
      <DialogHeader>
        <DialogTitle>Agregar nueva evaluación</DialogTitle>
        <DialogDescription>Registra una evaluación pendiente para tu calendario.</DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="eval-subject">Materia</Label>
        <select
          id="eval-subject"
          className={selectClass}
          value={subjectId}
          disabled={lockSubject}
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
        <p className={cn("rounded-md bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400")}>
          Ojo: esta materia ya suma {currentWeight}% en evaluaciones; con esta pasaría de 100%.
        </p>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">Guardar</Button>
      </DialogFooter>
    </form>
  );
}
