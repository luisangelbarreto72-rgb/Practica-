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
import { calculateEvaluationPoints } from "@/lib/academic-math";
import type { Evaluation } from "@/types/database";

type SubmitFn = (id: string, earnedScore: number, maxScore: number) => void | Promise<void>;

interface GradeEvaluationModalProps {
  evaluation: Evaluation | null;
  onClose: () => void;
  onSubmit: SubmitFn;
}

export function GradeEvaluationModal({ evaluation, onClose, onSubmit }: GradeEvaluationModalProps) {
  return (
    <Dialog open={evaluation !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        {/* key: reinicia el formulario al calificar otra evaluación */}
        {evaluation && (
          <GradeForm key={evaluation.id} evaluation={evaluation} onCancel={onClose} onSubmit={onSubmit} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function GradeForm({
  evaluation,
  onCancel,
  onSubmit,
}: {
  evaluation: Evaluation;
  onCancel: () => void;
  onSubmit: SubmitFn;
}) {
  const alreadyGraded = evaluation.status === "graded" && evaluation.earned_score !== null;
  const [earned, setEarned] = useState(alreadyGraded ? String(evaluation.earned_score) : "");
  const [max, setMax] = useState(String(evaluation.max_score));
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  const e = parseFloat(earned);
  const m = parseFloat(max);

  const maxError = !(m > 0) ? "La nota máxima debe ser mayor que 0." : undefined;
  const earnedError =
    earned.trim() === ""
      ? "Escribe la nota que obtuviste."
      : !(e >= 0)
        ? "La nota no puede ser negativa."
        : m > 0 && e > m
          ? `La nota no puede superar la máxima (${m}).`
          : undefined;
  const hasErrors = Boolean(earnedError || maxError);
  const preview = !hasErrors ? calculateEvaluationPoints(e, m, evaluation.weight_percentage) : null;

  const invalid = "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/30";

  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={async (ev) => {
        ev.preventDefault();
        setSubmitted(true);
        if (hasErrors) return;
        setSaving(true);
        try {
          await onSubmit(evaluation.id, e, m);
        } finally {
          setSaving(false);
        }
      }}
    >
      <DialogHeader>
        <DialogTitle>
          {alreadyGraded ? "Editar nota" : "Calificar"}: {evaluation.title}
        </DialogTitle>
        <DialogDescription>
          Peso de esta evaluación: {evaluation.weight_percentage}% de la nota final.
        </DialogDescription>
      </DialogHeader>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="grade-earned">Nota obtenida</Label>
          <Input
            id="grade-earned"
            type="number"
            inputMode="decimal"
            min={0}
            step="any"
            value={earned}
            onChange={(x) => setEarned(x.target.value)}
            aria-invalid={submitted && Boolean(earnedError)}
            className={submitted && earnedError ? invalid : ""}
            autoFocus
          />
          {submitted && earnedError && (
            <p role="alert" className="text-xs text-red-600 dark:text-red-400">
              {earnedError}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="grade-max">Nota máxima</Label>
          <Input
            id="grade-max"
            type="number"
            inputMode="decimal"
            min={0}
            step="any"
            value={max}
            onChange={(x) => setMax(x.target.value)}
            aria-invalid={submitted && Boolean(maxError)}
            className={submitted && maxError ? invalid : ""}
          />
          {submitted && maxError && (
            <p role="alert" className="text-xs text-red-600 dark:text-red-400">
              {maxError}
            </p>
          )}
        </div>
      </div>

      {preview !== null && (
        <p className="rounded-md bg-muted px-3 py-2 text-sm">
          Aportará <span className="font-semibold">{preview}</span> de {evaluation.weight_percentage} pts a tu nota.
        </p>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          Cancelar
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Guardando…" : "Guardar nota"}
        </Button>
      </DialogFooter>
    </form>
  );
}
