import { ref } from "vue";
import { supabase } from "./supabaseClient";

export const session = ref<any>(null);
export const isTeacher = ref<boolean>(false);

export const initSession = async () => {
  const { data } = await supabase.auth.getSession();
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
  const { data, error } = await supabase
    .from("users")
    .select("is_teacher")
    .eq("user_id", userId)
    .single();

  if (!error && data) {
    isTeacher.value = data.is_teacher;
  }
};
