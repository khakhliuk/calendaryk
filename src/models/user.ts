export interface User {
  user_id: string;
  telegram_id: string;
  is_teacher: boolean;
  name: string;
  created_at: Date;
  birthday: Date;
  email: string;
  is_active: boolean;
}
