import type { Task } from "@/types/database";
import { unwrap, type Supabase } from "./shared";

/** Pendientes primero (más antiguos arriba); completadas al final. RLS limita al usuario. */
export async function fetchTasks(sb: Supabase): Promise<Task[]> {
  const rows = unwrap(await sb.from("tasks").select("*").order("created_at", { ascending: true }));
  return (rows ?? []) as Task[];
}

export async function createTask(sb: Supabase, userId: string, title: string): Promise<Task> {
  const row = unwrap(await sb.from("tasks").insert({ user_id: userId, title }).select().single());
  return row as Task;
}

export async function setTaskCompleted(sb: Supabase, id: string, completed: boolean): Promise<Task> {
  const row = unwrap(
    await sb
      .from("tasks")
      .update({ is_completed: completed, completed_at: completed ? new Date().toISOString() : null })
      .eq("id", id)
      .select()
      .single()
  );
  return row as Task;
}

export async function deleteTask(sb: Supabase, id: string): Promise<void> {
  unwrap(await sb.from("tasks").delete().eq("id", id));
}
