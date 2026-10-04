import { ref } from "vue";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";

const REQUEST_TIMEOUT_MS = 8000;

const withTimeout = <T>(promise: Promise<T>, ms = REQUEST_TIMEOUT_MS) => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("Request timeout")), ms),
    ),
  ]);
};

export const session = ref<Session | null>(null);
export const isTeacher = ref(false);

export const getCurrentUserId = (): string => {
  const userId = session.value?.user.id;
  if (!userId) {
    throw new Error("Користувач не авторизований");
  }
  return userId;
};

const loadRole = async (userId: string) => {
  const { data, error } = await withTimeout(
    Promise.resolve(
      supabase
        .from("users")
        .select("is_teacher")
        .eq("user_id", userId)
        .single(),
    ),
  );

  if (!error && data) {
    isTeacher.value = data.is_teacher;
  }
};

export const initSession = async () => {
  try {
    const { data } = await withTimeout(supabase.auth.getSession());
    session.value = data.session;

    if (data.session?.user) {
      await loadRole(data.session.user.id);
    }
  } catch (error) {
    console.error("Failed to restore session", error);
  }

  supabase.auth.onAuthStateChange((_event, newSession) => {
    session.value = newSession;

    if (!newSession?.user) {
      isTeacher.value = false;
      return;
    }

    // Запити до supabase всередині колбеку onAuthStateChange можуть
    // заблокувати клієнт, тому виносимо їх з поточного виклику
    const userId = newSession.user.id;
    setTimeout(() => {
      loadRole(userId).catch(console.error);
    }, 0);
  });
};
