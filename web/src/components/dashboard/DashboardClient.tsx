"use client";

import { useMemo, useState } from "react";
import { CalendarDays, GraduationCap, LayoutGrid, Moon, Plus, Settings, Sparkles, Sun } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { DashboardKpiGrid } from "@/components/dashboard/DashboardKpiGrid";
import { UpcomingEvaluationsWidget } from "@/components/dashboard/UpcomingEvaluationsWidget";
import { GradeSimulatorDrawer } from "@/components/simulator/GradeSimulatorDrawer";
import { SubjectCard } from "@/components/dashboard/SubjectCard";
import { calculateOverallAverage, calculateSubjectMetrics, getUpcomingEvaluations, type SubjectMetrics } from "@/lib/academic-math";
import { useData } from "@/components/data-provider";
import { EvaluationFormModal } from "@/components/evaluations/EvaluationFormModal";
import { GradeEvaluationModal } from "@/components/evaluations/GradeEvaluationModal";
import { SubjectFormModal } from "@/components/subjects/SubjectFormModal";
import { ConfirmDialog } from "@/components/ui-extra/ConfirmDialog";
import { SettingsModal } from "@/components/settings/SettingsModal";
import { TasksCard } from "@/components/tasks/TasksCard";
import { WeeklySchedule } from "@/components/schedule/WeeklySchedule";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { Subject } from "@/types/database";

export function DashboardClient() {
  const {
    subjects, evaluations, minPassingGrade, loading, loadError,
    fullName, userEmail, tasks, classBlocks, extrasError, updateProfile, addTask, toggleTask, deleteTask,
    addSubject, updateSubject, deleteSubject, addEvaluation, gradeEvaluation, seedSampleData,
  } = useData();
  const { resolvedTheme, setTheme } = useTheme();

  const metrics = useMemo(
    () => subjects.map((s) => calculateSubjectMetrics(s, evaluations, minPassingGrade)),
    [subjects, evaluations, minPassingGrade]
  );
  const average = useMemo(() => calculateOverallAverage(metrics), [metrics]);
  const evaluatedSubjectsCount = useMemo(
    () => metrics.filter((m) => m.evaluatedWeight > 0).length,
    [metrics]
  );
  const upcoming = useMemo(() => getUpcomingEvaluations(evaluations, subjects), [evaluations, subjects]);
  const [activeTab, setActiveTab] = useState<string>("resumen");
  const [simulatingId, setSimulatingId] = useState<string | null>(null);
  const simulating: SubjectMetrics | null = metrics.find((m) => m.subject.id === simulatingId) ?? null;
  const [subjectModal, setSubjectModal] = useState<{ open: boolean; subject: Subject | null }>({ open: false, subject: null });
  const [deleting, setDeleting] = useState<Subject | null>(null);
  const [gradingId, setGradingId] = useState<string | null>(null);
  const grading = evaluations.find((e) => e.id === gradingId) ?? null;
  const [evalFormOpen, setEvalFormOpen] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const evalCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of evaluations) m.set(e.subject_id, (m.get(e.subject_id) ?? 0) + 1);
    return m;
  }, [evaluations]);
  const displayName = fullName?.trim() || (userEmail ? userEmail.split("@")[0] : null);
  const today = new Date().toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long" });
  const isEmpty = !loading && subjects.length === 0;
  const passingCount = metrics.filter((m) => m.isPassing).length;

  return (
    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(String(v))} className="min-h-screen gap-0 bg-background">
      {/* Barra superior limpia con saludo capitalizado y pestañas integradas */}
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-col gap-2.5 px-4 py-3 md:h-16 md:flex-row md:items-center md:justify-between md:py-0 md:px-6">
          <div className="flex items-center justify-between gap-3 md:min-w-0">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border/80 bg-card shadow-xs">
                <GraduationCap className="size-4 text-foreground" />
              </div>
              <div className="min-w-0 leading-tight">
                <h1 className="truncate font-heading text-sm font-semibold tracking-tight text-foreground sm:text-base">
                  {displayName ? (
                    <>
                      Hola, <span className="capitalize">{displayName}</span>
                    </>
                  ) : (
                    "Gestor Académico"
                  )}
                </h1>
                <p className="truncate text-xs text-muted-foreground first-letter:uppercase">{today}</p>
              </div>
            </div>

            {/* Acciones en móvil */}
            <div className="flex shrink-0 items-center gap-0.5 md:hidden">
              <Button variant="ghost" size="icon-sm" aria-label="Configuración" title="Configuración" onClick={() => setSettingsOpen(true)}>
                <Settings className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Cambiar tema"
                onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              >
                <Sun className="size-4 dark:hidden" />
                <Moon className="hidden size-4 dark:block" />
              </Button>
              <SignOutButton />
            </div>
          </div>

          {/* Pestañas integradas en la barra superior */}
          <TabsList className="h-9 w-full bg-muted/70 p-1 md:w-auto">
            <TabsTrigger value="resumen" className="gap-1.5 px-3 text-xs font-medium sm:text-sm">
              <LayoutGrid className="size-3.5" />
              Resumen
            </TabsTrigger>
            <TabsTrigger value="horario" className="gap-1.5 px-3 text-xs font-medium sm:text-sm">
              <CalendarDays className="size-3.5" />
              Horario semanal
            </TabsTrigger>
          </TabsList>

          {/* Acciones en escritorio */}
          <div className="hidden shrink-0 items-center gap-0.5 md:flex">
            <Button variant="ghost" size="icon-sm" aria-label="Configuración" title="Configuración" onClick={() => setSettingsOpen(true)}>
              <Settings className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
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

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-6 md:py-8">
        {loadError && (
          <p role="alert" className="mb-5 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-sm text-destructive">
            No se pudieron cargar tus datos: {loadError}
          </p>
        )}
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-2 py-24 text-center">
            <p className="text-sm text-muted-foreground">Cargando tus materias…</p>
          </div>
        ) : (
          <>
            <TabsContent value="resumen" className="space-y-6">
              {isEmpty ? (
                <div className="space-y-6">
                  <Card className="border border-border/80 shadow-sm ring-0">
                    <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
                      <div className="flex size-12 items-center justify-center rounded-xl border border-border/80 bg-muted/50">
                        <GraduationCap className="size-6 text-muted-foreground" />
                      </div>
                      <div className="max-w-md space-y-1">
                        <h2 className="font-heading text-lg font-semibold tracking-tight">Aún no tienes materias</h2>
                        <p className="text-sm text-muted-foreground">
                          Agrega tu primera materia para empezar a seguir tus notas, o carga datos de ejemplo para explorar la app.
                        </p>
                      </div>
                      <div className="flex flex-wrap justify-center gap-2">
                        <Button size="sm" onClick={() => setSubjectModal({ open: true, subject: null })}>
                          <Plus className="size-4" /> Agregar materia
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
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

                  <TasksCard
                    tasks={tasks}
                    error={extrasError}
                    onAdd={addTask}
                    onToggle={toggleTask}
                    onDelete={deleteTask}
                  />
                </div>
              ) : (
                <>
                  {/* Fila superior del Bento Grid: 4 tarjetas KPI compactas */}
                  <DashboardKpiGrid
                    average={average}
                    evaluatedSubjectsCount={evaluatedSubjectsCount}
                    passingCount={passingCount}
                    totalSubjects={metrics.length}
                    minPassingGrade={minPassingGrade}
                    classBlocks={classBlocks}
                    subjects={subjects}
                    tasks={tasks}
                    onOpenSchedule={() => setActiveTab("horario")}
                  />

                  {/* Fila intermedia equilibrada: Próximas Evaluaciones + Tareas Rápidas */}
                  <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <Card className="h-full border border-border/80 shadow-sm ring-0">
                      <CardContent className="h-full">
                        <UpcomingEvaluationsWidget
                          items={upcoming}
                          onAdd={() => setEvalFormOpen(true)}
                          onSelect={(ev) => setGradingId(ev.id)}
                        />
                      </CardContent>
                    </Card>

                    <TasksCard
                      tasks={tasks}
                      error={extrasError}
                      onAdd={addTask}
                      onToggle={toggleTask}
                      onDelete={deleteTask}
                    />
                  </section>

                  {/* Sección de materias */}
                  <section className="space-y-3.5 pt-1">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <h2 className="font-heading text-lg font-semibold tracking-tight">Tus materias</h2>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground tabular-nums">
                          {metrics.length}
                        </span>
                      </div>
                      <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={() => setSubjectModal({ open: true, subject: null })}>
                        <Plus className="size-3.5" /> Agregar materia
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {metrics.map((m) => (
                        <SubjectCard
                          key={m.subject.id}
                          metrics={m}
                          onSimulate={() => setSimulatingId(m.subject.id)}
                          evaluationCount={evalCounts.get(m.subject.id) ?? 0}
                          onEdit={() => setSubjectModal({ open: true, subject: m.subject })}
                          onDelete={() => setDeleting(m.subject)}
                        />
                      ))}
                    </div>
                  </section>
                </>
              )}
            </TabsContent>

            <TabsContent value="horario">
              <WeeklySchedule />
            </TabsContent>
          </>
        )}
      </main>

      <SettingsModal
        open={settingsOpen}
        fullName={fullName}
        minPassingGrade={minPassingGrade}
        onOpenChange={setSettingsOpen}
        onSubmit={async (data) => {
          const ok = await updateProfile(data);
          if (ok) {
            setSettingsOpen(false);
            toast.success("Configuración guardada");
          }
        }}
      />

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
    </Tabs>
  );
}
