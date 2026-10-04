import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { session } from "./session";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Основний клієнт - відповідає за авторизацію та edge-функції
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

let dbClient: SupabaseClient | null = null;
let dbClientToken: string | undefined;

// Окремий клієнт для запитів до БД з токеном поточної сесії.
// Він не керує авторизацією, тому не блокується під час оновлення сесії.
// Перестворюється лише тоді, коли змінюється токен.
export const createSupabaseDbClient = (): SupabaseClient => {
  const accessToken = session.value?.access_token;

  if (dbClient && dbClientToken === accessToken) {
    return dbClient;
  }

  dbClientToken = accessToken;
  dbClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    },
  });

  return dbClient;
};
