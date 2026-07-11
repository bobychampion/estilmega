import { createClient } from "@supabase/supabase-js";

const metaEnv = (import.meta as any).env || {};

const supabaseUrl = metaEnv.VITE_SUPABASE_URL || "https://nnhqmaxhvznxaerhkbas.supabase.co";
const supabaseAnonKey = metaEnv.VITE_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export function handleSupabaseError(error: unknown, operationType: OperationType, path: string | null) {
  const message = error instanceof Error ? error.message : String(error);
  console.error("Supabase Error: ", JSON.stringify({ error: message, operationType, path }));
  throw new Error(message);
}

export async function testConnection() {
  try {
    const { error } = await supabase.from("settings").select("id").limit(1);
    if (error) throw error;
    console.log("Supabase connected successfully!");
  } catch (error) {
    console.warn("Supabase connection check failed (offline fallback is enabled for seamless offline use):", error);
  }
}
