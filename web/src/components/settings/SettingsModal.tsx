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
import type { ProfileData } from "@/lib/data/types";

interface SettingsModalProps {
  open: boolean;
  fullName: string | null;
  minPassingGrade: number;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ProfileData) => void | Promise<void>;
}

export function SettingsModal({ open, onOpenChange, ...rest }: SettingsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>{open && <Form onCancel={() => onOpenChange(false)} {...rest} />}</DialogContent>
    </Dialog>
  );
}

function Form({
  fullName,
  minPassingGrade,
  onCancel,
  onSubmit,
}: Omit<SettingsModalProps, "open" | "onOpenChange"> & { onCancel: () => void }) {
  const [name, setName] = useState(fullName ?? "");
  const [min, setMin] = useState(String(minPassingGrade));
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  const m = parseFloat(min);
  const nameError = name.trim().length > 60 ? "Máximo 60 caracteres." : undefined;
  const minError = min.trim() === "" ? "Indica la nota mínima." : !(m > 0 && m <= 100) ? "Debe estar entre 1 y 100." : undefined;
  const invalid = "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/30";

  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setSubmitted(true);
        if (nameError || minError) return;
        setSaving(true);
        try {
          await onSubmit({ full_name: name.trim() || null, default_min_passing_grade: m });
        } finally {
          setSaving(false);
        }
      }}
    >
      <DialogHeader>
        <DialogTitle>Configuración</DialogTitle>
        <DialogDescription>Tu nombre y la nota mínima aprobatoria por defecto de tus materias.</DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="settings-name">Nombre</Label>
        <Input
          id="settings-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tu nombre"
          aria-invalid={Boolean(submitted && nameError)}
          className={submitted && nameError ? invalid : ""}
          autoFocus
        />
        {submitted && nameError && (
          <p role="alert" className="text-xs text-red-600 dark:text-red-400">{nameError}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="settings-min">Nota mínima aprobatoria global (sobre 100)</Label>
        <Input
          id="settings-min"
          type="number"
          inputMode="decimal"
          min={1}
          max={100}
          step="any"
          value={min}
          onChange={(e) => setMin(e.target.value)}
          aria-invalid={Boolean(submitted && minError)}
          className={submitted && minError ? invalid : ""}
        />
        {submitted && minError && (
          <p role="alert" className="text-xs text-red-600 dark:text-red-400">{minError}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Las materias con su propia nota mínima conservan la suya.
        </p>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>Cancelar</Button>
        <Button type="submit" disabled={saving}>{saving ? "Guardando…" : "Guardar"}</Button>
      </DialogFooter>
    </form>
  );
}
