import { createSupabaseDbClient } from "../lib/supabaseClient";

interface CreateSchedulePayload {
  title: string;
  isGroup: boolean;
  date: Date;
  link: string | null;
  // id учня або групи, залежно від isGroup
  id: string;
}

export const createSchedule = async (payload: CreateSchedulePayload) => {
  const { error } = await createSupabaseDbClient().functions.invoke(
    "create_schedule",
    { body: JSON.stringify(payload) },
  );

  if (error) throw error;
};

// Видаляє регулярне заняття разом з ще не проведеними уроками по ньому
export const deleteSchedule = async (scheduleId: string) => {
  const db = createSupabaseDbClient();

  const { error: attendanceError } = await db
    .from("attendances")
    .delete()
    .eq("schedule_id", scheduleId)
    .eq("status", "scheduled");

  if (attendanceError) throw attendanceError;

  const { error } = await db.from("schedule").delete().eq("id", scheduleId);

  if (error) throw error;
};
