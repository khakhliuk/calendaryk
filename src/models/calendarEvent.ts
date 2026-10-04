import type { LessonStatus } from "../constants/lessonStatus";

export interface EventStudent {
  user_id: string;
  name: string;
}

// Подія у форматі, який очікує vue-cal
export interface CalEvent {
  start: string;
  end: string;
  title: string;
  class: "event-group" | "event-individual";
  status: LessonStatus;
  students: EventStudent[];
  attendance_id: string | null;
  note: string | null;
  link: string | null;
}
