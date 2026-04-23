export interface ScheduleWithDetails {
  id: string;
  title: string;
  start_date: string;
  is_group: boolean;
  teacher_id: string;
  group_id: string | null;
  student_id: string | null;
  group: {
    title: string;
  } | null;
  student: {
    name: string;
  } | null;
}
