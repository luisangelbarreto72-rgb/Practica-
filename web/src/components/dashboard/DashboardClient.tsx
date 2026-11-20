"use client";

import { useMemo, useState } from "react";
import { GraduationCap, Moon, Plus, Sparkles, Sun } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { OverallAverageCard } from "@/components/dashboard/OverallAverageCard";
import { UpcomingEvaluationsWidget } from "@/components/dashboard/UpcomingEvaluationsWidget";
import { GradeSimulatorDrawer } from "@/components/simulator/GradeSimulatorDrawer";
import { SubjectCard } from "@/components/dashboard/SubjectCard";
import { calculateOverallAverage, calculateSubjectMetrics, getUpcomingEvaluations, type SubjectMetrics } from "@/lib/academic-math";
import { useData } from "@/components/data-provider";
import { EvaluationFormModal } from "@/components/evaluations/EvaluationFormModal";
import { GradeEvaluationModal } from "@/components/evaluations/GradeEvaluationModal";
import { SubjectFormModal } from "@/components/subjects/SubjectFormModal";
import { ConfirmDialog } from "@/components/ui-extra/ConfirmDialog";
import type { Subject } from "@/types/database";

export function DashboardClient() {
  const {
    subjects, evaluations, minPassingGrade, loading, loadError,
    addSubject, updateSubject, deleteSubject, addEvaluation, gradeEvaluation, seedSampleData,
  } = useData();
  const { resolvedTheme, setTheme } = useTheme();

  const metrics = useMemo(
    () => subjects.map((s) => calculateSubjectMetrics(s, evaluations, minPassingGrade)),
    [subjects, evaluations, minPassingGrade]
  );
  const average = calculateOverallAverage(metrics);
  const upcoming = useMemo(() => getUpcomingEvaluations(evaluations, subjects), [evaluations, subjects]);
  const [simulatingId, setSimulatingId] = useState<string | null>(null);
  const simulating: SubjectMetrics | null = metrics.find((m) => m.subject.id === simulatingId) ?? null;
  const [subjectModal, setSubjectModal] = useState<{ open: boolean; subject: Subject | null }>({ open: false, subject: null });
  const [deleting, setDeleting] = useState<Subject | null>(null);
  const [gradingId, setGradingId] = useState<string | null>(null);
  const grading = evaluations.find((e) => e.id === gradingId) ?? null;
  const [evalFormOpen, setEvalFormOpen] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const isEmpty = !loading && subjects.length === 0;
  const passingCount = metrics.filter((m) => m.isPassing).length;

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2 font-semibold">
            <GraduationCap className="size-5" /> Gestor Académico
          </div>
          <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Cambiar tema"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          >
            <Sun className="size-4 dark:hidden" />
            <Moon className="hidden size-4 dark:block" />
          </Button>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl p-4 md:p-6">
        {loadError && (
          <p role="alert" className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            No se pudieron cargar tus datos: {loadError}
          </p>
        )}
        {loading ? (
          <p className="py-20 text-center text-sm text-muted-foreground">Cargando tus materias…</p>
        ) : isEmpty ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
              <GraduationCap className="size-10 text-muted-foreground" />
              <div>
                <h2 className="text-lg font-semibold">Aún no tienes materias</h2>
                <p className="text-sm text-muted-foreground">
                  Agrega tu primera materia para empezar a seguir tus notas, o carga datos de ejemplo para explorar la app.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                <Button onClick={() => setSubjectModal({ open: true, subject: null })}>
                  <Plus className="size-4" /> Agregar materia
                </Button>
                <Button
                  variant="secondary"
                  disabled={seeding}
                  onClick={async () => {
                    setSeeding(true);
                    const ok = await seedSampleData();
                    setSeeding(false);
                    if (ok) toast.success("Datos de ejemplo cargados");
                  }}
                >
                  <Sparkles className="size-4" /> {seeding ? "Cargando…" : "Cargar datos de ejemplo"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <Card className="lg:col-span-1">
                <CardContent>
                  <OverallAverageCard
                    average={average}
                    passingCount={passingCount}
                    totalSubjects={metrics.length}
                    minPassingGrade={minPassingGrade}
                  />
                </CardContent>
              </Card>
              <Card className="lg:col-span-2">
                <CardContent className="h-full">
                  <UpcomingEvaluationsWidget
                    items={upcoming}
                    onAdd={() => setEvalFormOpen(true)}
                    onSelect={(ev) => setGradingId(ev.id)}
                  />
                </CardContent>
              </Card>
            </section>

            <section className="mt-6 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Tus materias</h2>
                <Button size="sm" onClick={() => setSubjectModal({ open: true, subject: null })}>
                  <Plus className="size-4" /> Agregar materia
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {metrics.map((m) => (
                  <SubjectCard
                    key={m.subject.id}
                    metrics={m}
                    onSimulate={() => setSimulatingId(m.subject.id)}
                    onEdit={() => setSubjectModal({ open: true, subject: m.subject })}
                    onDelete={() => setDeleting(m.subject)}
                  />
                ))}
              </div>
            </section>
          </>
        )}
      </main>

      <GradeSimulatorDrawer metrics={simulating} onClose={() => setSimulatingId(null)} />

      <SubjectFormModal
        open={subjectModal.open}
        subject={subjectModal.subject}
        globalMinPassingGrade={minPassingGrade}
        onOpenChange={(open) => setSubjectModal((st) => ({ ...st, open }))}
        onSubmit={async (input) => {
          const editing = subjectModal.subject;
          const ok = editing ? await updateSubject(editing.id, input) : await addSubject(input);
          if (ok) {
            setSubjectModal({ open: false, subject: null });
            toast.success(editing ? "Materia actualizada" : "Materia agregada");
          }
        }}
      />

      <ConfirmDialog
        open={deleting !== null}
        title={`¿Eliminar ${deleting?.name ?? "la materia"}?`}
        description="Se eliminarán también todas sus evaluaciones. Esta acción no se puede deshacer."
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return;
          const ok = await deleteSubject(deleting.id);
          if (ok) toast.success("Materia eliminada");
          setDeleting(null);
        }}
      />

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
        onOpenChange={setEvalFormOpen}
        onSubmit={async (input) => {
          const ok = await addEvaluation(input);
          if (ok) {
            setEvalFormOpen(false);
            toast.success("Evaluación agregada");
          }
        }}
      />
    </div>
  );
}
