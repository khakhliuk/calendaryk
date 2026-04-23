export interface Attendance {
  id: string;
  student_id: string;
  teacher_id: string;
  date: Date;
  status: "scheduled" | "happend" | "cancelled" | string;
  note: string | null;
  schedule_id: string | null;
}
