import { format } from "date-fns";
import type { LessonStatus } from "../constants/lessonStatus";
import type { CalEvent, EventStudent } from "../models/calendarEvent";

const LESSON_DURATION_MS = 60 * 60 * 1000;
const VUE_CAL_DATE_FORMAT = "yyyy-MM-dd HH:mm";

export interface AttendanceRow {
  id: string;
  date: string;
  status: LessonStatus;
  note: string | null;
  link: string | null;
  student: EventStudent | null;
  schedule: { id: string; title: string; is_group: boolean } | null;
}

export interface ScheduleRow {
  id: string;
  title: string;
  start_date: string;
  is_group: boolean;
  students: EventStudent | EventStudent[] | null;
}

const toEventTime = (start: Date) => ({
  start: format(start, VUE_CAL_DATE_FORMAT),
  end: format(new Date(start.getTime() + LESSON_DURATION_MS), VUE_CAL_DATE_FORMAT),
});

const toArray = <T>(value: T | T[] | null): T[] => {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
};

/**
 * Збирає події для календаря з двох джерел:
 *  - attendances: вже створені уроки (мають статус, примітку, посилання)
 *  - schedules: регулярний розклад, з якого "домальовуються" майбутні
 *    заняття, для яких ще немає записів в attendances
 */
export const buildCalEvents = (
  attendances: AttendanceRow[],
  schedules: ScheduleRow[],
  rangeStart: Date,
  rangeEnd: Date,
): CalEvent[] => {
  const events = new Map<string, CalEvent>();

  for (const row of attendances) {
    const startDate = new Date(row.date);
    const dateKey = format(startDate, "yyyy-MM-dd");
    const key = row.schedule
      ? `${row.schedule.id}_${dateKey}`
      : `single_${row.id}`;

    if (!events.has(key)) {
      events.set(key, {
        ...toEventTime(startDate),
        title: row.schedule?.title ?? row.student?.name ?? "Заняття",
        class: row.schedule?.is_group ? "event-group" : "event-individual",
        status: row.status,
        students: [],
        note: row.note,
        link: row.link,
        attendance_id: row.id,
      });
    }

    if (row.student) {
      events.get(key)!.students.push({
        user_id: row.student.user_id,
        name: row.student.name,
      });
    }
  }

  for (const schedule of schedules) {
    const firstDate = new Date(schedule.start_date);
    const students = toArray(schedule.students);

    // Знаходимо перший потрібний день тижня в межах діапазону
    const cursor = new Date(rangeStart);
    cursor.setUTCHours(firstDate.getUTCHours(), firstDate.getUTCMinutes(), 0, 0);
    while (cursor.getUTCDay() !== firstDate.getUTCDay()) {
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    for (; cursor < rangeEnd; cursor.setUTCDate(cursor.getUTCDate() + 7)) {
      const key = `${schedule.id}_${format(cursor, "yyyy-MM-dd")}`;
      if (events.has(key)) continue;

      events.set(key, {
        ...toEventTime(cursor),
        title: schedule.title,
        class: schedule.is_group ? "event-group" : "event-individual",
        status: "scheduled",
        students: students.map(({ user_id, name }) => ({ user_id, name })),
        note: null,
        link: null,
        attendance_id: null,
      });
    }
  }

  return Array.from(events.values()).sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
  );
};
