export type GetHistoryAttendance = {
  id: string;
  date: Date;
  status: "happened" | "planned" | "cancelled";
  student_id: string;
  note: string | null;
  schedule_id: string;
  users: {
    name: string;
    user_id: string;
  };
  schedule: {
    id: string;
    title: string;
    groups: {
      id: string;
      title: string;
    } | null;
    group_id: string | null;
    start_date: string;
  };
};

export type GroupedAttendance = {
  schedule_id: string | null;
  schedule: GetHistoryAttendance["schedule"] | null;
  date: Date;
  students: {
    attendance_id: string;
    student_id: string;
    name: string;
    status: string;
    note: string | null;
  }[];
  showStudents: boolean;
};
