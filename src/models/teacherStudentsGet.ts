export interface TeacherStudentsGet {
  user_id: string;
  telegram_id: string;
  telegram_username: string;
  name: string;
  created_at: Date;
  birthday: Date;
  email: string;
  is_active: boolean;
}
