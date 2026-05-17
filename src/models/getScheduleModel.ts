export interface GetScheduleModel {
  id: number;
  date: string;
  status: string;
  student_id: string;
  student: {
    user_id: string;
    name: string;
  }[];
  schedule: {
    id: number;
    start_date: string;
    title: string;
    group_id: number;
    is_group: boolean;
    group: {
      id: number;
      title: string;
    }[];
  }[];
}

export type EventStudent = {
  user_id: string;
  name: string;
};

export type CalEvent = {
  start: string;
  end: string;
  title: string;
  class: string;
  status: string;

  students: EventStudent[];

  attendance_id?: string | null;
  note?: string | null;
  link?: string | null;
};
