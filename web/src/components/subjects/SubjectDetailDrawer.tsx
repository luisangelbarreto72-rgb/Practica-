"use client";

import { useMemo, useState } from "react";
import {
  ExternalLink,
  FlaskConical,
  FolderOpen,
  ListChecks,
  Pencil,
  Plus,
  Trash2,
  User,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useData } from "@/components/data-provider";
import { EvaluationFormModal } from "@/components/evaluations/EvaluationFormModal";
import { GradeEvaluationModal } from "@/components/evaluations/GradeEvaluationModal";
import { GradeSimulatorPanel } from "@/components/simulator/GradeSimulatorDrawer";
import { AbsenceControl } from "@/components/subjects/AbsenceControl";
import { ConfirmDialog } from "@/components/ui-extra/ConfirmDialog";
import { calculateEvaluationPoints, type SubjectMetrics } from "@/lib/academic-math";
import type { Evaluation, Subject } from "@/types/database";

export type SubjectDrawerTab = "evaluaciones" | "simulador";

interface SubjectDetailDrawerProps {
  metrics: SubjectMetrics | null;
  initialTab?: SubjectDrawerTab;
  onClose: () => void;
  onEditSubject: (subject: Subject) => void;
}

function formatDate(iso: string | null): string {
  if (!iso) return "Sin fecha";
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es", { day: "numeric", month: "short" });
}

function sortEvaluations(list: Evaluation[]): Evaluation[] {
  return [...list].sort((a, b) => {
    if (a.status !== b.status) return a.status === "pending" ? -1 : 1;
    return (a.due_date ?? "").localeCompare(b.due_date ?? "");
  });
}

function getSafeExternalUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.toString() : null;
  } catch {
    return null;
  }
}

export function SubjectDetailDrawer({
  metrics,
  initialTab = "evaluaciones",
  onClose,
  onEditSubject,
}: SubjectDetailDrawerProps) {
  return (
    <Drawer
      open={metrics !== null}
      swipeDirection="right"
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DrawerContent className="data-[swipe-axis=x]:[--drawer-content-width:94vw] data-[swipe-axis=x]:sm:[--drawer-content-width:32rem] data-[swipe-axis=x]:md:[--drawer-content-width:36rem]">
        {metrics && (
          <SubjectDetailDrawerBody
            key={`${metrics.subject.id}-${initialTab}`}
            metrics={metrics}
            initialTab={initialTab}
            onClose={onClose}
            onEditSubject={onEditSubject}
          />
        )}
      </DrawerContent>
    </Drawer>
  );
}

function SubjectDetailDrawerBody({
  metrics,
  initialTab,
  onClose,
  onEditSubject,
}: {
  metrics: SubjectMetrics;
  initialTab: SubjectDrawerTab;
  onClose: () => void;
  onEditSubject: (subject: Subject) => void;
}) {
  const {
    subjects,
    evaluations,
    addEvaluation,
    updateEvaluation,
    gradeEvaluation,
    deleteEvaluation,
    updateSubjectAbsences,
  } = useData();

  const { subject } = metrics;
  const [activeTab, setActiveTab] = useState<SubjectDrawerTab>(initialTab);
  const [evalFormOpen, setEvalFormOpen] = useState(false);
  const [editingEvalId, setEditingEvalId] = useState<string | null>(null);
  const [deletingEval, setDeletingEval] = useState<Evaluation | null>(null);
  const [gradingId, setGradingId] = useState<string | null>(null);

  const subjectEvaluations = useMemo(
    () => sortEvaluations(evaluations.filter((e) => e.subject_id === subject.id)),
    [evaluations, subject.id]
  );
  const grading = evaluations.find((e) => e.id === gradingId) ?? null;
  const editingEval = evaluations.find((e) => e.id === editingEvalId) ?? null;
  const safeResourceUrl = getSafeExternalUrl(subject.resource_url);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <DrawerHeader className="border-b pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <DrawerTitle className="flex items-center gap-2 text-lg font-semibold">
              <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: subject.color_hex }} />
              <span className="truncate">{subject.name}</span>
            </DrawerTitle>
            <DrawerDescription className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
              <span className="inline-flex items-center gap-1">
                <User className="size-3.5 shrink-0" />
                {subject.professor ? subject.professor : "Sin profesor asignado"}
              </span>
            </DrawerDescription>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Editar ${subject.name}`}
              title="Editar materia"
              onClick={() => onEditSubject(subject)}
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Cerrar panel"
              onClick={onClose}
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>

        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          {safeResourceUrl ? (
            <a
              href={safeResourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-7 items-center gap-1.5 rounded-lg border bg-background px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
            >
              <FolderOpen className="size-3.5 text-muted-foreground" />
              Carpeta de estudio
              <ExternalLink className="size-3 text-muted-foreground" />
            </a>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="xs"
              className="text-muted-foreground"
              onClick={() => onEditSubject(subject)}
            >
              <FolderOpen className="size-3" /> Añadir carpeta de estudio
            </Button>
          )}
        </div>
      </DrawerHeader>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
        {/* Resumen de nota */}
        <div className="flex flex-col gap-2 rounded-lg border bg-card p-3">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-2xl font-bold tabular-nums">
              {metrics.earnedPoints}
              <span className="text-xs font-normal text-muted-foreground"> / 100</span>
            </p>
            <span className="text-xs text-muted-foreground">
              Evaluado: {metrics.evaluatedWeight}%
            </span>
          </div>
          <div className="relative pt-1">
            <Progress value={Math.min(100, metrics.earnedPoints)} aria-label={`Progreso de ${subject.name}`} />
            <div
              className="absolute top-0 h-3 w-0.5 bg-foreground/60"
              style={{ left: `${metrics.minPassingGrade}%` }}
              title={`Nota mínima: ${metrics.minPassingGrade}`}
            />
          </div>
          <p
            className={
              metrics.isPassing
                ? "text-xs font-medium text-emerald-600 dark:text-emerald-400"
                : "text-xs text-muted-foreground"
            }
          >
            {metrics.isPassing
              ? "¡Ya alcanzaste la nota mínima!"
              : `Te faltan ${metrics.pointsNeededToPass} pts para aprobar (mín. ${metrics.minPassingGrade})`}
          </p>
        </div>

        {/* Control de inasistencias */}
        <AbsenceControl
          subjectName={subject.name}
          absencesCount={subject.absences_count}
          maxAbsences={subject.max_absences}
          onChange={(next) => void updateSubjectAbsences(subject.id, next)}
          variant="full"
        />

        {/* Evaluaciones y Simulador */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as SubjectDrawerTab)}
          className="flex flex-col gap-3"
        >
          <TabsList className="w-full">
            <TabsTrigger value="evaluaciones" className="flex-1">
              <ListChecks className="size-3.5" /> Evaluaciones ({subjectEvaluations.length})
            </TabsTrigger>
            <TabsTrigger value="simulador" className="flex-1">
              <FlaskConical className="size-3.5" /> Simulador
            </TabsTrigger>
          </TabsList>

          <TabsContent value="evaluaciones" className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                Haz clic en una evaluación para registrar o editar su nota.
              </p>
              <Button type="button" size="xs" onClick={() => setEvalFormOpen(true)}>
                <Plus className="size-3" /> Agregar
              </Button>
            </div>

            {subjectEvaluations.length === 0 ? (
              <div className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
                Aún no hay evaluaciones en esta materia.
              </div>
            ) : (
              <ul className="divide-y rounded-lg border bg-card">
                {subjectEvaluations.map((ev) => {
                  const graded = ev.status === "graded" && ev.earned_score !== null;
                  return (
                    <li
                      key={ev.id}
                      className="flex items-center justify-between gap-2 p-3 transition-colors hover:bg-muted/40"
                    >
                      <button
                        type="button"
                        className="min-w-0 flex-1 text-left outline-none focus-visible:underline"
                        onClick={() => setGradingId(ev.id)}
                      >
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium">{ev.title}</span>
                          {graded ? (
                            <Badge className="border-0 bg-emerald-500/15 text-[10px] text-emerald-600 dark:text-emerald-400">
                              Calificada
                            </Badge>
                          ) : (
                            <Badge className="border-0 bg-amber-500/15 text-[10px] text-amber-600 dark:text-amber-400">
                              Pendiente
                            </Badge>
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                          <span>{formatDate(ev.due_date)}</span>
                          <span className="tabular-nums">Peso: {ev.weight_percentage}%</span>
                          {graded && (
                            <span className="font-medium text-foreground tabular-nums">
                              {ev.earned_score}/{ev.max_score} (+
                              {calculateEvaluationPoints(ev.earned_score!, ev.max_score, ev.weight_percentage)} pts)
                            </span>
                          )}
                        </div>
                      </button>

                      <div className="flex shrink-0 items-center gap-0.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          aria-label={`Editar ${ev.title}`}
                          onClick={() => setEditingEvalId(ev.id)}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          aria-label={`Eliminar ${ev.title}`}
                          onClick={() => setDeletingEval(ev)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </TabsContent>

          <TabsContent value="simulador">
            <GradeSimulatorPanel key={subject.id} metrics={metrics} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Modales de evaluaciones */}
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
        open={evalFormOpen}
        subjects={subjects}
        evaluations={evaluations}
        defaultSubjectId={subject.id}
        lockSubject
        onOpenChange={setEvalFormOpen}
        onSubmit={async (input) => {
          const ok = await addEvaluation(input);
          if (ok) {
            setEvalFormOpen(false);
            toast.success("Evaluación agregada");
          }
        }}
      />

      <EvaluationFormModal
        open={editingEval !== null}
        subjects={subjects}
        evaluations={evaluations}
        evaluation={editingEval}
        defaultSubjectId={subject.id}
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
    </div>
  );
}
