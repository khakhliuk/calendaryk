export interface User {
  user_id: string;
  telegram_id: string;
  telegram_username: string;
  is_teacher: boolean;
  name: string;
  email: string;
  birthday: string | null;
  created_at: string;
  is_active: boolean;
}
