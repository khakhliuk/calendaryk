import type { LessonStatus } from "../constants/lessonStatus";

export type GetHistoryAttendance = {
  id: string;
  date: Date;
  status: LessonStatus;
  student_id: string;
  note: string | null;
  schedule_id: string | null;
  users: {
    name: string;
    user_id: string;
  } | null;
  schedule: {
    id: string;
    title: string;
    groups: {
      id: string;
      title: string;
    } | null;
    group_id: string | null;
    start_date: string;
  } | null;
};

export type GroupedAttendance = {
  schedule_id: string | null;
  schedule: GetHistoryAttendance["schedule"];
  date: Date;
  status: LessonStatus;
  students: {
    attendance_id: string;
    student_id: string;
    name: string;
    status: LessonStatus;
    note: string | null;
  }[];
};
