import type { LessonStatus } from "../constants/lessonStatus";

export interface Attendance {
  id: string;
  student_id: string;
  teacher_id: string;
  date: string;
  status: LessonStatus;
  note: string | null;
  link: string | null;
  schedule_id: string | null;
}
