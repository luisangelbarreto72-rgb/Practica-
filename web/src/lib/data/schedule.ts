import type { ClassBlock } from "@/types/database";
import { unwrap, type Supabase } from "./shared";
import type { ClassBlockInput } from "./types";

/** La BD devuelve TIME como HH:MM:SS; en la app usamos HH:MM. */
const hhmm = (t: unknown): string => String(t).slice(0, 5);

function toBlock(r: Record<string, unknown>): ClassBlock {
  return {
    ...(r as unknown as ClassBlock),
    day_of_week: Number(r.day_of_week),
    start_time: hhmm(r.start_time),
    end_time: hhmm(r.end_time),
  };
}

export async function fetchClassBlocks(sb: Supabase): Promise<ClassBlock[]> {
  const rows = unwrap(await sb.from("class_blocks").select("*").order("start_time", { ascending: true }));
  return (rows ?? []).map(toBlock);
}

export async function createClassBlock(sb: Supabase, userId: string, input: ClassBlockInput): Promise<ClassBlock> {
  const row = unwrap(await sb.from("class_blocks").insert({ user_id: userId, ...input }).select().single());
  return toBlock(row);
}

export async function updateClassBlock(sb: Supabase, id: string, input: ClassBlockInput): Promise<ClassBlock> {
  const row = unwrap(await sb.from("class_blocks").update(input).eq("id", id).select().single());
  return toBlock(row);
}

export async function deleteClassBlock(sb: Supabase, id: string): Promise<void> {
  unwrap(await sb.from("class_blocks").delete().eq("id", id));
}
