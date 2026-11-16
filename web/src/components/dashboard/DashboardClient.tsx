"use client";

import { useMemo, useState } from "react";
import { GraduationCap, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { OverallAverageCard } from "@/components/dashboard/OverallAverageCard";
import { UpcomingEvaluationsWidget } from "@/components/dashboard/UpcomingEvaluationsWidget";
import { GradeSimulatorDrawer } from "@/components/simulator/GradeSimulatorDrawer";
import { SubjectCard } from "@/components/dashboard/SubjectCard";
import { calculateOverallAverage, calculateSubjectMetrics, getUpcomingEvaluations, type SubjectMetrics } from "@/lib/academic-math";
import { useData } from "@/components/data-provider";

export function DashboardClient() {
  const { subjects, evaluations, minPassingGrade } = useData();
  const { resolvedTheme, setTheme } = useTheme();

  const metrics = useMemo(
    () => subjects.map((s) => calculateSubjectMetrics(s, evaluations, minPassingGrade)),
    [subjects, evaluations, minPassingGrade]
  );
  const average = calculateOverallAverage(metrics);
  const upcoming = useMemo(() => getUpcomingEvaluations(evaluations, subjects), [evaluations, subjects]);
  const [simulatingId, setSimulatingId] = useState<string | null>(null);
  const simulating: SubjectMetrics | null = metrics.find((m) => m.subject.id === simulatingId) ?? null;
  const passingCount = metrics.filter((m) => m.isPassing).length;

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2 font-semibold">
            <GraduationCap className="size-5" /> Gestor Académico
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Cambiar tema"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          >
            <Sun className="size-4 dark:hidden" />
            <Moon className="hidden size-4 dark:block" />
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl p-4 md:p-6">
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
              <UpcomingEvaluationsWidget items={upcoming} />
            </CardContent>
          </Card>
        </section>

        <section className="mt-6 space-y-3">
          <h2 className="text-lg font-semibold">Tus materias</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {metrics.map((m) => (
              <SubjectCard key={m.subject.id} metrics={m} onSimulate={() => setSimulatingId(m.subject.id)} />
            ))}
          </div>
        </section>

      </main>

      <GradeSimulatorDrawer metrics={simulating} onClose={() => setSimulatingId(null)} />
    </div>
  );
}
