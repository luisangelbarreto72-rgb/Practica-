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
import type { SubjectInput } from "@/lib/data/types";
import { cn } from "@/lib/utils";
import type { Subject } from "@/types/database";

export const SUBJECT_COLORS = [
  "#1A5F7A",
  "#22A39F",
  "#E07A5F",
  "#6C63FF",
  "#F2A541",
  "#D6457A",
  "#3A9D5D",
  "#64748B",
];

interface SubjectFormModalProps {
  open: boolean;
  /** Si se pasa, el formulario edita esa materia; si no, crea una nueva. */
  subject?: Subject | null;
  /** Nota mínima global, solo para mostrarla como referencia. */
  globalMinPassingGrade: number;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: SubjectInput) => void | Promise<void>;
}

export function SubjectFormModal({ open, onOpenChange, ...rest }: SubjectFormModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {open && <Form onCancel={() => onOpenChange(false)} {...rest} />}
      </DialogContent>
    </Dialog>
  );
}

function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function Form({
  subject,
  globalMinPassingGrade,
  onCancel,
  onSubmit,
}: Omit<SubjectFormModalProps, "open" | "onOpenChange"> & { onCancel: () => void }) {
  const editing = Boolean(subject);
  const [name, setName] = useState(subject?.name ?? "");
  const [color, setColor] = useState(subject?.color_hex ?? SUBJECT_COLORS[0]);
  const [minGrade, setMinGrade] = useState(
    subject?.min_passing_grade !== null && subject?.min_passing_grade !== undefined
      ? String(subject.min_passing_grade)
      : ""
  );
  const [maxAbsences, setMaxAbsences] = useState(String(subject?.max_absences ?? 4));
  const [professor, setProfessor] = useState(subject?.professor ?? "");
  const [resourceUrl, setResourceUrl] = useState(subject?.resource_url ?? "");
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  const g = parseFloat(minGrade);
  const maxAbs = parseInt(maxAbsences, 10);
  const trimmedUrl = resourceUrl.trim();
  const errors = {
    name: !name.trim() ? "Escribe el nombre de la materia." : name.trim().length > 60 ? "Máximo 60 caracteres." : undefined,
    minGrade:
      minGrade.trim() !== "" && !(g > 0 && g <= 100) ? "La nota mínima debe estar entre 1 y 100." : undefined,
    maxAbsences:
      !Number.isInteger(maxAbs) || maxAbs < 1 || maxAbs > 99
        ? "Debe ser un número entero entre 1 y 99."
        : undefined,
    resourceUrl:
      trimmedUrl !== "" && !isValidHttpUrl(trimmedUrl)
        ? "Ingresa una URL válida que empiece por http:// o https://."
        : undefined,
  };
  const hasErrors = Boolean(errors.name || errors.minGrade || errors.maxAbsences || errors.resourceUrl);
  const invalid = "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/30";

  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setSubmitted(true);
        if (hasErrors) return;
        setSaving(true);
        try {
          await onSubmit({
            name: name.trim(),
            color_hex: color,
            min_passing_grade: minGrade.trim() === "" ? null : g,
            max_absences: maxAbs,
            professor: professor.trim() === "" ? null : professor.trim(),
            resource_url: trimmedUrl === "" ? null : trimmedUrl,
          });
        } finally {
          setSaving(false);
        }
      }}
    >
      <DialogHeader>
        <DialogTitle>{editing ? "Editar materia" : "Agregar materia"}</DialogTitle>
        <DialogDescription>
          {editing
            ? "Actualiza los datos, el límite de faltas, el profesor o la carpeta de estudio."
            : "Crea una materia para registrar sus evaluaciones e inasistencias."}
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="subject-name">Nombre</Label>
        <Input
          id="subject-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Cálculo I"
          aria-invalid={submitted && Boolean(errors.name)}
          className={submitted && errors.name ? invalid : ""}
          autoFocus
        />
        {submitted && errors.name && (
          <p role="alert" className="text-xs text-red-600 dark:text-red-400">
            {errors.name}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Color</Label>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Color de la materia">
          {SUBJECT_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={color === c}
              aria-label={`Color ${c}`}
              onClick={() => setColor(c)}
              className={cn(
                "size-7 rounded-full outline-none ring-offset-2 ring-offset-background transition focus-visible:ring-2 focus-visible:ring-ring",
                color === c && "ring-2 ring-foreground"
              )}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="subject-min">Nota mínima (opcional)</Label>
          <Input
            id="subject-min"
            type="number"
            inputMode="decimal"
            min={1}
            max={100}
            step="any"
            value={minGrade}
            onChange={(e) => setMinGrade(e.target.value)}
            placeholder={`Global (${globalMinPassingGrade})`}
            aria-invalid={submitted && Boolean(errors.minGrade)}
            className={submitted && errors.minGrade ? invalid : ""}
          />
          {submitted && errors.minGrade && (
            <p role="alert" className="text-xs text-red-600 dark:text-red-400">
              {errors.minGrade}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="subject-max-absences">Máx. inasistencias</Label>
          <Input
            id="subject-max-absences"
            type="number"
            inputMode="numeric"
            min={1}
            max={99}
            step={1}
            value={maxAbsences}
            onChange={(e) => setMaxAbsences(e.target.value)}
            aria-invalid={submitted && Boolean(errors.maxAbsences)}
            className={submitted && errors.maxAbsences ? invalid : ""}
          />
          {submitted && errors.maxAbsences && (
            <p role="alert" className="text-xs text-red-600 dark:text-red-400">
              {errors.maxAbsences}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="subject-professor">Profesor (opcional)</Label>
        <Input
          id="subject-professor"
          value={professor}
          onChange={(e) => setProfessor(e.target.value)}
          placeholder="Ej: Dra. María González"
          maxLength={80}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="subject-resource-url">Carpeta de estudio / Enlace (opcional)</Label>
        <Input
          id="subject-resource-url"
          type="url"
          value={resourceUrl}
          onChange={(e) => setResourceUrl(e.target.value)}
          placeholder="https://drive.google.com/..."
          aria-invalid={submitted && Boolean(errors.resourceUrl)}
          className={submitted && errors.resourceUrl ? invalid : ""}
        />
        {submitted && errors.resourceUrl && (
          <p role="alert" className="text-xs text-red-600 dark:text-red-400">
            {errors.resourceUrl}
          </p>
        )}
      </div>

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
