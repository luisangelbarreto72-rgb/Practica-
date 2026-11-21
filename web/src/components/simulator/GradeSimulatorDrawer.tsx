"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  simulateSubjectGrade,
  type SimulatedEvaluationInput,
  type SubjectMetrics,
} from "@/lib/academic-math";

const inputClass =
  "h-9 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

interface GradeSimulatorDrawerProps {
  metrics: SubjectMetrics | null;
  onClose: () => void;
}

export function GradeSimulatorDrawer({ metrics, onClose }: GradeSimulatorDrawerProps) {
  return (
    <Drawer open={metrics !== null} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent>
        {/* key: reinicia el estado del simulador al cambiar de materia */}
        {metrics && <SimulatorBody key={metrics.subject.id} metrics={metrics} onClose={onClose} />}
      </DrawerContent>
    </Drawer>
  );
}

export function GradeSimulatorPanel({ metrics }: { metrics: SubjectMetrics }) {
  const [items, setItems] = useState<SimulatedEvaluationInput[]>([]);
  const [score, setScore] = useState("");
  const [maxScore, setMaxScore] = useState("");
  const [weight, setWeight] = useState("");

  const result = simulateSubjectGrade(metrics.earnedPoints, items, metrics.minPassingGrade);

  function addItem() {
    const s = parseFloat(score);
    const m = parseFloat(maxScore);
    const w = parseFloat(weight);
    if (!(m > 0) || !(w > 0) || !(s >= 0) || s > m) return;
    setItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), score: s, maxScore: m, weightPercentage: w },
    ]);
    setScore("");
    setMaxScore("");
    setWeight("");
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-muted-foreground">
        Puntaje acumulado: <strong className="text-foreground">{metrics.earnedPoints}/100</strong>. Agrega notas ficticias; no se guardan.
      </p>

      <div className="grid grid-cols-3 gap-2">
        <label className="text-xs text-muted-foreground">
          Nota obtenida
          <input className={inputClass} type="number" inputMode="decimal" min={0} value={score} onChange={(e) => setScore(e.target.value)} />
        </label>
        <label className="text-xs text-muted-foreground">
          Nota máxima
          <input className={inputClass} type="number" inputMode="decimal" min={0} value={maxScore} onChange={(e) => setMaxScore(e.target.value)} />
        </label>
        <label className="text-xs text-muted-foreground">
          Peso (%)
          <input className={inputClass} type="number" inputMode="decimal" min={0} max={100} value={weight} onChange={(e) => setWeight(e.target.value)} />
        </label>
      </div>
      <Button type="button" onClick={addItem}>Añadir nota ficticia</Button>

      {items.length > 0 && (
        <ul className="flex flex-col divide-y rounded-md border">
          {items.map((it) => (
            <li key={it.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
              <span>
                + {simulateSubjectGrade(0, [it]).simulatedAddedPoints} pts{" "}
                <span className="text-muted-foreground">
                  ({it.score}/{it.maxScore}, {it.weightPercentage}%)
                </span>
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Quitar nota"
                onClick={() => setItems((prev) => prev.filter((p) => p.id !== it.id))}
              >
                <Trash2 className="size-4 text-red-500" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className="rounded-lg bg-muted p-4 text-center">
        <p className="text-xs text-muted-foreground">Promedio simulado</p>
        <p className="text-3xl font-bold tabular-nums">{result.projectedTotal}/100</p>
        <p className={`text-sm font-medium ${result.wouldPass ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
          {result.wouldPass
            ? "✅ Con estas notas aprobarías"
            : `⚠️ Aún te faltarían ${result.pointsNeededToPass} pts`}
        </p>
      </div>
    </div>
  );
}

function SimulatorBody({ metrics, onClose }: { metrics: SubjectMetrics; onClose: () => void }) {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col overflow-y-auto">
      <DrawerHeader>
        <DrawerTitle>Simulador: {metrics.subject.name}</DrawerTitle>
        <DrawerDescription>
          Prueba distintos escenarios sin modificar tus notas reales.
        </DrawerDescription>
      </DrawerHeader>

      <div className="px-4 pt-3">
        <GradeSimulatorPanel metrics={metrics} />
      </div>

      <DrawerFooter className="pt-4">
        <Button variant="outline" onClick={onClose}>
          Cerrar
        </Button>
      </DrawerFooter>
    </div>
  );
}
