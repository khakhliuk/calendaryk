import { createSupabaseDbClient } from "../lib/supabaseClient";
import type { User } from "../models/user";

// Повертає всіх учнів, прив'язаних до вчителя, відсортованих за ім'ям
export const fetchTeacherStudents = async (
  teacherId: string,
): Promise<User[]> => {
  const supabase = createSupabaseDbClient();

  const { data: relations, error: relationsError } = await supabase
    .from("teachers_students")
    .select("student_id")
    .eq("teacher_id", teacherId);

  if (relationsError) throw relationsError;
  if (!relations?.length) return [];

  const studentIds = relations.map((r) => r.student_id);

  const { data: students, error: studentsError } = await supabase
    .from("users")
    .select("*")
    .in("user_id", studentIds)
    .order("name");

  if (studentsError) throw studentsError;

  return students ?? [];
};

// +1 до оплачених занять. Якщо облік оплат для учня вимкнений - нічого не робимо
export const incrementPaidLessons = async (
  teacherId: string,
  studentId: string,
) => {
  const supabase = createSupabaseDbClient();

  const { data, error } = await supabase
    .from("teachers_students")
    .select("paid_lessons")
    .eq("teacher_id", teacherId)
    .eq("student_id", studentId)
    .maybeSingle();

  if (error) throw error;
  if (data?.paid_lessons == null) return;

  const { error: updateError } = await supabase
    .from("teachers_students")
    .update({ paid_lessons: data.paid_lessons + 1 })
    .eq("teacher_id", teacherId)
    .eq("student_id", studentId);

  if (updateError) throw updateError;
};
