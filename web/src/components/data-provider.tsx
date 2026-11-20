"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { createEvaluation, deleteEvaluation as dbDeleteEvaluation, fetchEvaluations, updateEvaluation as dbUpdateEvaluation } from "@/lib/data/evaluations";
import { DEFAULT_MIN_PASSING_GRADE, fetchProfile, saveProfile } from "@/lib/data/profile";
import {
  createClassBlock,
  deleteClassBlock as dbDeleteClassBlock,
  fetchClassBlocks,
  updateClassBlock as dbUpdateClassBlock,
} from "@/lib/data/schedule";
import { createTask, deleteTask as dbDeleteTask, fetchTasks, setTaskCompleted } from "@/lib/data/tasks";
import { seedSampleData as dbSeedSampleData } from "@/lib/data/seed";
import { createSubject, deleteSubject as dbDeleteSubject, fetchSubjects, updateSubject as dbUpdateSubject } from "@/lib/data/subjects";
import type { ClassBlockInput, EvaluationPatch, NewEvaluationData, ProfileData, SubjectInput } from "@/lib/data/types";
import { MOCK_MIN_PASSING_GRADE, mockEvaluations, mockSubjects } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/client";
import type { ClassBlock, Evaluation, Subject, Task } from "@/types/database";

export type { ClassBlockInput, EvaluationPatch, NewEvaluationData, ProfileData, SubjectInput };

interface DataContextValue {
  subjects: Subject[];
  evaluations: Evaluation[];
  minPassingGrade: number;
  /** Nombre del perfil (profiles.full_name); null si aún no lo ha definido */
  fullName: string | null;
  /** Correo de la sesión (para el saludo si no hay nombre) */
  userEmail: string | null;
  tasks: Task[];
  classBlocks: ClassBlock[];
  /** Error al cargar tareas/horario (p. ej. falta ejecutar la migración 002); no bloquea el resto */
  extrasError: string | null;
  /** true mientras se cargan los datos desde Supabase */
  loading: boolean;
  loadError: string | null;
  /** true cuando Supabase no está configurado y se usan datos de prueba en memoria */
  isDemo: boolean;
  addSubject: (input: SubjectInput) => Promise<boolean>;
  updateSubject: (id: string, input: SubjectInput) => Promise<boolean>;
  deleteSubject: (id: string) => Promise<boolean>;
  addEvaluation: (data: NewEvaluationData) => Promise<boolean>;
  updateEvaluation: (id: string, patch: EvaluationPatch) => Promise<boolean>;
  gradeEvaluation: (id: string, earnedScore: number, maxScore: number) => Promise<boolean>;
  deleteEvaluation: (id: string) => Promise<boolean>;
  seedSampleData: () => Promise<boolean>;
  updateProfile: (data: ProfileData) => Promise<boolean>;
  addTask: (title: string) => Promise<boolean>;
  toggleTask: (id: string, completed: boolean) => Promise<boolean>;
  deleteTask: (id: string) => Promise<boolean>;
  addClassBlock: (input: ClassBlockInput) => Promise<boolean>;
  updateClassBlock: (id: string, input: ClassBlockInput) => Promise<boolean>;
  deleteClassBlock: (id: string) => Promise<boolean>;
}

const DataContext = createContext<DataContextValue | null>(null);

const supabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

function message(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

/**
 * Fuente de datos de la app. Con Supabase configurado lee y escribe en las tablas
 * `subjects` y `evaluations` (RLS limita todo al usuario autenticado). Sin Supabase
 * (desarrollo local sin .env) funciona en memoria con datos de prueba.
 */
export function DataProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => (supabaseConfigured ? createClient() : null), []);
  const isDemo = supabase === null;

  const [subjects, setSubjects] = useState<Subject[]>(isDemo ? mockSubjects : []);
  const [evaluations, setEvaluations] = useState<Evaluation[]>(isDemo ? mockEvaluations : []);
  const [minPassingGrade, setMinPassingGrade] = useState(isDemo ? MOCK_MIN_PASSING_GRADE : DEFAULT_MIN_PASSING_GRADE);
  const [fullName, setFullName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [classBlocks, setClassBlocks] = useState<ClassBlock[]>([]);
  const [extrasError, setExtrasError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!isDemo);
  const [loadError, setLoadError] = useState<string | null>(null);

  const userIdRef = useRef<string | null>(null);
  const loadSeq = useRef(0);

  const loadAll = useCallback(
    async (userId: string) => {
      if (!supabase) return;
      const seq = ++loadSeq.current;
      setLoading(true);
      setLoadError(null);
      try {
        // Tareas y horario se cargan aparte: si su tabla aún no existe, el resto sigue funcionando.
        let extrasMsg: string | null = null;
        const soft = <T,>(fallback: T) => (err: unknown) => {
          extrasMsg = message(err);
          return fallback;
        };
        const [s, e, profile, t, cb] = await Promise.all([
          fetchSubjects(supabase),
          fetchEvaluations(supabase),
          fetchProfile(supabase, userId),
          fetchTasks(supabase).catch(soft<Task[]>([])),
          fetchClassBlocks(supabase).catch(soft<ClassBlock[]>([])),
        ]);
        if (seq !== loadSeq.current) return; // llegó una carga más reciente
        setSubjects(s);
        setEvaluations(e);
        setMinPassingGrade(profile.default_min_passing_grade);
        setFullName(profile.full_name);
        setTasks(t);
        setClassBlocks(cb);
        setExtrasError(extrasMsg);
      } catch (err) {
        if (seq !== loadSeq.current) return;
        setLoadError(message(err));
      } finally {
        if (seq === loadSeq.current) setLoading(false);
      }
    },
    [supabase]
  );

  // Sigue la sesión: carga los datos al iniciar sesión y LIMPIA todo al cerrarla
  // (para que un usuario nunca vea datos del anterior).
  useEffect(() => {
    if (!supabase) return;
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const uid = session?.user?.id ?? null;
      if (uid === userIdRef.current) return; // p. ej. refresco de token
      userIdRef.current = uid;
      setUserEmail(session?.user?.email ?? null);
      if (uid) {
        // setTimeout: no hacer llamadas a Supabase dentro del callback de auth
        setTimeout(() => void loadAll(uid), 0);
      } else {
        loadSeq.current++;
        setSubjects([]);
        setEvaluations([]);
        setTasks([]);
        setClassBlocks([]);
        setFullName(null);
        setExtrasError(null);
        setLoadError(null);
        setLoading(false);
      }
    });
    return () => data.subscription.unsubscribe();
  }, [supabase, loadAll]);

  /** Ejecuta una operación; ante error muestra un toast y devuelve false. */
  const run = useCallback(async (label: string, fn: () => Promise<void>): Promise<boolean> => {
    try {
      await fn();
      return true;
    } catch (err) {
      toast.error(`${label}: ${message(err)}`);
      return false;
    }
  }, []);

  const requireUser = useCallback((): string => {
    if (!userIdRef.current) throw new Error("Tu sesión expiró. Vuelve a iniciar sesión.");
    return userIdRef.current;
  }, []);

  const addSubject = useCallback(
    (input: SubjectInput) =>
      run("No se pudo crear la materia", async () => {
        if (!supabase) {
          setSubjects((p) => [
            ...p,
            { id: crypto.randomUUID(), user_id: "demo-user", is_archived: false, created_at: new Date().toISOString(), ...input },
          ]);
          return;
        }
        const created = await createSubject(supabase, requireUser(), input);
        setSubjects((p) => [...p, created]);
      }),
    [supabase, run, requireUser]
  );

  const updateSubject = useCallback(
    (id: string, input: SubjectInput) =>
      run("No se pudo guardar la materia", async () => {
        if (!supabase) {
          setSubjects((p) => p.map((s) => (s.id === id ? { ...s, ...input } : s)));
          return;
        }
        const updated = await dbUpdateSubject(supabase, id, input);
        setSubjects((p) => p.map((s) => (s.id === id ? updated : s)));
      }),
    [supabase, run]
  );

  const deleteSubject = useCallback(
    (id: string) =>
      run("No se pudo eliminar la materia", async () => {
        if (supabase) await dbDeleteSubject(supabase, id);
        setSubjects((p) => p.filter((s) => s.id !== id));
        setEvaluations((p) => p.filter((e) => e.subject_id !== id)); // cascada
        setClassBlocks((p) => p.filter((b) => b.subject_id !== id)); // cascada
      }),
    [supabase, run]
  );

  const addEvaluation = useCallback(
    (data: NewEvaluationData) =>
      run("No se pudo crear la evaluación", async () => {
        if (!supabase) {
          const now = new Date().toISOString();
          setEvaluations((p) => [
            ...p,
            {
              id: crypto.randomUUID(),
              user_id: "demo-user",
              status: "pending",
              max_score: 100,
              earned_score: null,
              reminder_days: 3,
              created_at: now,
              updated_at: now,
              ...data,
            },
          ]);
          return;
        }
        const created = await createEvaluation(supabase, requireUser(), data);
        setEvaluations((p) => [...p, created]);
      }),
    [supabase, run, requireUser]
  );

  const updateEvaluation = useCallback(
    (id: string, patch: EvaluationPatch) =>
      run("No se pudo guardar la evaluación", async () => {
        if (!supabase) {
          setEvaluations((p) =>
            p.map((e) => (e.id === id ? { ...e, ...patch, updated_at: new Date().toISOString() } : e))
          );
          return;
        }
        const updated = await dbUpdateEvaluation(supabase, id, patch);
        setEvaluations((p) => p.map((e) => (e.id === id ? updated : e)));
      }),
    [supabase, run]
  );

  const gradeEvaluation = useCallback(
    (id: string, earnedScore: number, maxScore: number) =>
      updateEvaluation(id, { status: "graded", earned_score: earnedScore, max_score: maxScore }),
    [updateEvaluation]
  );

  const deleteEvaluation = useCallback(
    (id: string) =>
      run("No se pudo eliminar la evaluación", async () => {
        if (supabase) await dbDeleteEvaluation(supabase, id);
        setEvaluations((p) => p.filter((e) => e.id !== id));
      }),
    [supabase, run]
  );

  const seedSampleData = useCallback(
    () =>
      run("No se pudieron cargar los datos de ejemplo", async () => {
        if (!supabase) {
          setSubjects(mockSubjects);
          setEvaluations(mockEvaluations);
          return;
        }
        const seeded = await dbSeedSampleData(supabase, requireUser());
        setSubjects((p) => [...p, ...seeded.subjects]);
        setEvaluations((p) => [...p, ...seeded.evaluations]);
      }),
    [supabase, run, requireUser]
  );

  const updateProfile = useCallback(
    (data: ProfileData) =>
      run("No se pudo guardar la configuración", async () => {
        const saved = supabase ? await saveProfile(supabase, requireUser(), data) : data;
        setFullName(saved.full_name);
        setMinPassingGrade(saved.default_min_passing_grade);
      }),
    [supabase, run, requireUser]
  );

  const addTask = useCallback(
    (title: string) =>
      run("No se pudo crear la tarea", async () => {
        const created: Task = supabase
          ? await createTask(supabase, requireUser(), title)
          : {
              id: crypto.randomUUID(),
              user_id: "demo-user",
              title,
              is_completed: false,
              completed_at: null,
              created_at: new Date().toISOString(),
            };
        setTasks((p) => [...p, created]);
      }),
    [supabase, run, requireUser]
  );

  const toggleTask = useCallback(
    async (id: string, completed: boolean) => {
      // Actualización optimista: el checkbox responde al instante; si falla, se revierte.
      const stamp = (t: Task, c: boolean): Task => ({ ...t, is_completed: c, completed_at: c ? new Date().toISOString() : null });
      setTasks((p) => p.map((t) => (t.id === id ? stamp(t, completed) : t)));
      const ok = await run("No se pudo actualizar la tarea", async () => {
        if (!supabase) return;
        const updated = await setTaskCompleted(supabase, id, completed);
        setTasks((p) => p.map((t) => (t.id === id ? updated : t)));
      });
      if (!ok) setTasks((p) => p.map((t) => (t.id === id ? stamp(t, !completed) : t)));
      return ok;
    },
    [supabase, run]
  );

  const deleteTask = useCallback(
    (id: string) =>
      run("No se pudo eliminar la tarea", async () => {
        if (supabase) await dbDeleteTask(supabase, id);
        setTasks((p) => p.filter((t) => t.id !== id));
      }),
    [supabase, run]
  );

  const addClassBlock = useCallback(
    (input: ClassBlockInput) =>
      run("No se pudo agregar la clase", async () => {
        const created: ClassBlock = supabase
          ? await createClassBlock(supabase, requireUser(), input)
          : { id: crypto.randomUUID(), user_id: "demo-user", created_at: new Date().toISOString(), ...input };
        setClassBlocks((p) => [...p, created]);
      }),
    [supabase, run, requireUser]
  );

  const updateClassBlock = useCallback(
    (id: string, input: ClassBlockInput) =>
      run("No se pudo guardar la clase", async () => {
        const updated = supabase ? await dbUpdateClassBlock(supabase, id, input) : null;
        setClassBlocks((p) => p.map((b) => (b.id === id ? updated ?? { ...b, ...input } : b)));
      }),
    [supabase, run]
  );

  const deleteClassBlock = useCallback(
    (id: string) =>
      run("No se pudo eliminar la clase", async () => {
        if (supabase) await dbDeleteClassBlock(supabase, id);
        setClassBlocks((p) => p.filter((b) => b.id !== id));
      }),
    [supabase, run]
  );

  const value = useMemo<DataContextValue>(
    () => ({
      subjects,
      evaluations,
      minPassingGrade,
      fullName,
      userEmail,
      tasks,
      classBlocks,
      extrasError,
      updateProfile,
      addTask,
      toggleTask,
      deleteTask,
      addClassBlock,
      updateClassBlock,
      deleteClassBlock,
      loading,
      loadError,
      isDemo,
      addSubject,
      updateSubject,
      deleteSubject,
      addEvaluation,
      updateEvaluation,
      gradeEvaluation,
      deleteEvaluation,
      seedSampleData,
    }),
    [
      subjects,
      evaluations,
      minPassingGrade,
      fullName,
      userEmail,
      tasks,
      classBlocks,
      extrasError,
      updateProfile,
      addTask,
      toggleTask,
      deleteTask,
      addClassBlock,
      updateClassBlock,
      deleteClassBlock,
      loading,
      loadError,
      isDemo,
      addSubject,
      updateSubject,
      deleteSubject,
      addEvaluation,
      updateEvaluation,
      gradeEvaluation,
      deleteEvaluation,
      seedSampleData,
    ]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData debe usarse dentro de <DataProvider>");
  return ctx;
}
