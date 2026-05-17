import { ref } from "vue";
import { supabase } from "./supabaseClient";

const withTimeout = <T>(promise: Promise<T>, ms = 8000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("Request timeout")), ms),
    ),
  ]);
};

export const session = ref<any>(null);
export const isTeacher = ref<boolean>(false);

export const initSession = async () => {
  const { data } = await withTimeout(supabase.auth.getSession());

  session.value = data.session;

  if (data.session?.user) {
    await loadRole(data.session.user.id);
  }

  supabase.auth.onAuthStateChange(async (_event, newSession) => {
    session.value = newSession;

    if (newSession?.user) {
      await loadRole(newSession.user.id);
    } else {
      isTeacher.value = false;
    }
  });
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
