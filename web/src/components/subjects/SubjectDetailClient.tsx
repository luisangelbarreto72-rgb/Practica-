"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useData } from "@/components/data-provider";
import { EvaluationFormModal } from "@/components/evaluations/EvaluationFormModal";
import { GradeEvaluationModal } from "@/components/evaluations/GradeEvaluationModal";
import { calculateEvaluationPoints, calculateSubjectMetrics } from "@/lib/academic-math";
import { SubjectFormModal } from "@/components/subjects/SubjectFormModal";
import { ConfirmDialog } from "@/components/ui-extra/ConfirmDialog";
import type { Evaluation } from "@/types/database";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" });
}

function sortEvaluations(list: Evaluation[]): Evaluation[] {
  // Pendientes primero (la más próxima arriba), luego las calificadas.
  return [...list].sort((a, b) => {
    if (a.status !== b.status) return a.status === "pending" ? -1 : 1;
    return (a.due_date ?? "").localeCompare(b.due_date ?? "");
  });
}

export function SubjectDetailClient({ subjectId }: { subjectId: string }) {
  const {
    subjects, evaluations, minPassingGrade, loading,
    addEvaluation, updateEvaluation, gradeEvaluation, deleteEvaluation, updateSubject, deleteSubject,
  } = useData();
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editingEvalId, setEditingEvalId] = useState<string | null>(null);
  const [deletingEval, setDeletingEval] = useState<Evaluation | null>(null);
  const [subjectFormOpen, setSubjectFormOpen] = useState(false);
  const [deletingSubject, setDeletingSubject] = useState(false);
  const [gradingId, setGradingId] = useState<string | null>(null);
  const grading = evaluations.find((e) => e.id === gradingId) ?? null;
  const editingEval = evaluations.find((e) => e.id === editingEvalId) ?? null;

  const subject = subjects.find((s) => s.id === subjectId);
  const metrics = useMemo(
    () => (subject ? calculateSubjectMetrics(subject, evaluations, minPassingGrade) : null),
    [subject, evaluations, minPassingGrade]
  );
  const subjectEvaluations = useMemo(
    () => sortEvaluations(evaluations.filter((e) => e.subject_id === subjectId)),
    [evaluations, subjectId]
  );

  if (loading) {
    return <div className="mx-auto max-w-3xl p-6 text-sm text-muted-foreground">Cargando…</div>;
  }

  if (!subject || !metrics) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <p className="mb-4">Materia no encontrada.</p>
        <Link href="/" className="underline">
          Volver al dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-4xl items-center gap-3 px-4">
          <Link href="/" aria-label="Volver al dashboard" className="rounded-md p-1.5 hover:bg-muted">
            <ArrowLeft className="size-5" />
          </Link>
          <span className="size-3 rounded-full" style={{ backgroundColor: subject.color_hex }} />
          <h1 className="truncate font-semibold">{subject.name}</h1>
          <div className="ml-auto flex gap-1">
            <Button variant="ghost" size="icon-sm" aria-label="Editar materia" onClick={() => setSubjectFormOpen(true)}>
              <Pencil className="size-4" />
            </Button>
            <Button variant="ghost" size="icon-sm" aria-label="Eliminar materia" onClick={() => setDeletingSubject(true)}>
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 p-4 md:p-6">
        <Card>
          <CardContent className="flex flex-col gap-3">
            <p className="text-3xl font-bold tabular-nums">
              {metrics.earnedPoints}
              <span className="text-sm font-normal text-muted-foreground"> / 100</span>
            </p>
            <div className="relative pt-1">
              <Progress value={Math.min(100, metrics.earnedPoints)} aria-label={`Progreso de ${subject.name}`} />
              <div
                className="absolute top-0 h-3 w-0.5 bg-foreground/60"
                style={{ left: `${metrics.minPassingGrade}%` }}
                title={`Nota mínima: ${metrics.minPassingGrade}`}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {metrics.isPassing
                ? "¡Ya alcanzaste la nota mínima!"
                : `Te faltan ${metrics.pointsNeededToPass} pts para aprobar (mín. ${metrics.minPassingGrade})`}
            </p>
          </CardContent>
        </Card>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Evaluaciones</h2>
            <Button size="sm" onClick={() => setFormOpen(true)}>
              <Plus className="size-4" /> Agregar evaluación
            </Button>
          </div>

          <Card>
            <CardContent className="px-0">
              {subjectEvaluations.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Aún no hay evaluaciones en esta materia.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Evaluación</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead className="text-right">Peso</TableHead>
                      <TableHead className="text-right">Nota</TableHead>
                      <TableHead className="text-right">Estado</TableHead>
                      <TableHead className="w-20"><span className="sr-only">Acciones</span></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subjectEvaluations.map((ev) => {
                      const graded = ev.status === "graded" && ev.earned_score !== null;
                      return (
                        <TableRow
                          key={ev.id}
                          className="cursor-pointer"
                          onClick={() => setGradingId(ev.id)}
                        >
                          <TableCell className="font-medium">
                            <button
                              type="button"
                              className="text-left outline-none hover:underline focus-visible:underline"
                              aria-label={(graded ? "Editar nota de " : "Calificar ") + ev.title}
                              onClick={(e) => { e.stopPropagation(); setGradingId(ev.id); }}
                            >
                              {ev.title}
                            </button>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">{formatDate(ev.due_date)}</TableCell>
                          <TableCell className="text-right tabular-nums">{ev.weight_percentage}%</TableCell>
                          <TableCell className="text-right whitespace-nowrap tabular-nums">
                            {graded ? (
                              <>
                                {ev.earned_score}/{ev.max_score}
                                <span className="block text-xs text-muted-foreground">
                                  +{calculateEvaluationPoints(ev.earned_score!, ev.max_score, ev.weight_percentage)} pts
                                </span>
                              </>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {graded ? (
                              <Badge className="border-0 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                                Calificada
                              </Badge>
                            ) : (
                              <Badge className="border-0 bg-amber-500/15 text-amber-600 dark:text-amber-400">
                                Pendiente
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right whitespace-nowrap">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={"Editar " + ev.title}
                              onClick={(e) => { e.stopPropagation(); setEditingEvalId(ev.id); }}
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={"Eliminar " + ev.title}
                              onClick={(e) => { e.stopPropagation(); setDeletingEval(ev); }}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </section>
      </main>

      <GradeEvaluationModal
        evaluation={grading}
        onClose={() => setGradingId(null)}
        onSubmit={async (id, earned, max) => {
          const ok = await gradeEvaluation(id, earned, max);
          if (ok) {
            setGradingId(null);
            toast.success("Nota guardada");
          }
        }}
      />

      <EvaluationFormModal
        open={formOpen}
        subjects={subjects}
        evaluations={evaluations}
        defaultSubjectId={subjectId}
        lockSubject
        onOpenChange={setFormOpen}
        onSubmit={async (input) => {
          const ok = await addEvaluation(input);
          if (ok) {
            setFormOpen(false);
            toast.success("Evaluación agregada");
          }
        }}
      />

      <EvaluationFormModal
        open={editingEval !== null}
        subjects={subjects}
        evaluations={evaluations}
        evaluation={editingEval}
        defaultSubjectId={subjectId}
        lockSubject
        onOpenChange={(open) => !open && setEditingEvalId(null)}
        onSubmit={async (input) => {
          if (!editingEval) return;
          const ok = await updateEvaluation(editingEval.id, {
            title: input.title,
            due_date: input.due_date,
            weight_percentage: input.weight_percentage,
          });
          if (ok) {
            setEditingEvalId(null);
            toast.success("Evaluación actualizada");
          }
        }}
      />

      <ConfirmDialog
        open={deletingEval !== null}
        title={`¿Eliminar ${deletingEval?.title ?? "la evaluación"}?`}
        description="Esta acción no se puede deshacer."
        onCancel={() => setDeletingEval(null)}
        onConfirm={async () => {
          if (!deletingEval) return;
          const ok = await deleteEvaluation(deletingEval.id);
          if (ok) toast.success("Evaluación eliminada");
          setDeletingEval(null);
        }}
      />

      <SubjectFormModal
        open={subjectFormOpen}
        subject={subject}
        globalMinPassingGrade={minPassingGrade}
        onOpenChange={setSubjectFormOpen}
        onSubmit={async (input) => {
          const ok = await updateSubject(subject.id, input);
          if (ok) {
            setSubjectFormOpen(false);
            toast.success("Materia actualizada");
          }
        }}
      />

      <ConfirmDialog
        open={deletingSubject}
        title={`¿Eliminar ${subject.name}?`}
        description="Se eliminarán también todas sus evaluaciones. Esta acción no se puede deshacer."
        onCancel={() => setDeletingSubject(false)}
        onConfirm={async () => {
          const ok = await deleteSubject(subject.id);
          setDeletingSubject(false);
          if (ok) {
            toast.success("Materia eliminada");
            router.push("/");
          }
        }}
      />
    </div>
  );
}
