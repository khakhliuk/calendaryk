import type { Schedule } from "./schedule";

export interface GetGroupModel {
  id: string;
  title: string;
  teacher_id: string;
  group_members: GroupMember[];
  schedule: Schedule[];
}

export interface GroupMember {
  id: string;
  group_id: string;
  student_id: string;
}
