"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
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
import { calculateEvaluationPoints, calculateSubjectMetrics } from "@/lib/academic-math";
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
  const { subjects, evaluations, minPassingGrade, addEvaluation } = useData();
  const [formOpen, setFormOpen] = useState(false);

  const subject = subjects.find((s) => s.id === subjectId);
  const metrics = useMemo(
    () => (subject ? calculateSubjectMetrics(subject, evaluations, minPassingGrade) : null),
    [subject, evaluations, minPassingGrade]
  );
  const subjectEvaluations = useMemo(
    () => sortEvaluations(evaluations.filter((e) => e.subject_id === subjectId)),
    [evaluations, subjectId]
  );

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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subjectEvaluations.map((ev) => {
                      const graded = ev.status === "graded" && ev.earned_score !== null;
                      return (
                        <TableRow key={ev.id}>
                          <TableCell className="font-medium">{ev.title}</TableCell>
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

      <EvaluationFormModal
        open={formOpen}
        subjects={subjects}
        evaluations={evaluations}
        defaultSubjectId={subjectId}
        lockSubject
        onOpenChange={setFormOpen}
        onSubmit={(input) => {
          addEvaluation(input);
          setFormOpen(false);
          toast.success("Evaluación agregada");
        }}
      />
    </div>
  );
}
