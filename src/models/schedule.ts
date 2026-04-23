export interface Schedule {
  id: string;
  title: string;
  start_date: Date;
  is_group: boolean;
  teacher_id: string;
  group_id: string;
  student_id: string;
}
