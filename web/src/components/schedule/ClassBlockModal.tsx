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
import type { ClassBlockInput } from "@/lib/data/types";
import type { ClassBlock, Subject } from "@/types/database";

export const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

const selectClass =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p role="alert" className="text-xs text-red-600 dark:text-red-400">{message}</p>;
}

interface ClassBlockModalProps {
  open: boolean;
  subjects: Subject[];
  block?: ClassBlock | null;
  defaultDay?: number;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: ClassBlockInput) => void | Promise<void>;
}

export function ClassBlockModal({ open, onOpenChange, ...rest }: ClassBlockModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>{open && <Form onCancel={() => onOpenChange(false)} {...rest} />}</DialogContent>
    </Dialog>
  );
}

function Form({
  subjects,
  block,
  defaultDay,
  onCancel,
  onSubmit,
}: Omit<ClassBlockModalProps, "open" | "onOpenChange"> & { onCancel: () => void }) {
  const editing = Boolean(block);
  const [subjectId, setSubjectId] = useState(block?.subject_id ?? subjects[0]?.id ?? "");
  const [day, setDay] = useState(block?.day_of_week ?? defaultDay ?? 1);
  const [start, setStart] = useState(block?.start_time ?? "");
  const [end, setEnd] = useState(block?.end_time ?? "");
  const [room, setRoom] = useState(block?.room ?? "");
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  const errors = {
    subject: subjectId ? undefined : "Elige una materia.",
    start: start ? undefined : "Indica la hora de inicio.",
    end: !end ? "Indica la hora de fin." : start && end <= start ? "Debe ser posterior al inicio." : undefined,
  };
  const hasErrors = Boolean(errors.subject || errors.start || errors.end);
  const show = (k: keyof typeof errors) => (submitted ? errors[k] : undefined);
  const invalid = (k: keyof typeof errors) =>
    show(k) ? "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/30" : "";

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
            subject_id: subjectId,
            day_of_week: day,
            start_time: start,
            end_time: end,
            room: room.trim() || null,
          });
        } finally {
          setSaving(false);
        }
      }}
    >
      <DialogHeader>
        <DialogTitle>{editing ? "Editar clase" : "Agregar clase"}</DialogTitle>
        <DialogDescription>Un bloque de tu horario semanal.</DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="cb-subject">Materia</Label>
        <select id="cb-subject" className={selectClass} value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <FieldError message={show("subject")} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="cb-day">Día</Label>
        <select id="cb-day" className={selectClass} value={day} onChange={(e) => setDay(Number(e.target.value))}>
          {DAYS.map((d, i) => (
            <option key={d} value={i + 1}>{d}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cb-start">Inicio</Label>
          <Input id="cb-start" type="time" value={start} onChange={(e) => setStart(e.target.value)}
            aria-invalid={Boolean(show("start"))} className={invalid("start")} />
          <FieldError message={show("start")} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cb-end">Fin</Label>
          <Input id="cb-end" type="time" value={end} onChange={(e) => setEnd(e.target.value)}
            aria-invalid={Boolean(show("end"))} className={invalid("end")} />
          <FieldError message={show("end")} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="cb-room">Aula (opcional)</Label>
        <Input id="cb-room" value={room} maxLength={40} placeholder="Ej: B-204" onChange={(e) => setRoom(e.target.value)} />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>Cancelar</Button>
        <Button type="submit" disabled={saving}>{saving ? "Guardando…" : "Guardar"}</Button>
      </DialogFooter>
    </form>
  );
}
