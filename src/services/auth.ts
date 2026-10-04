import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";

export interface TelegramUserInfo {
  id: number | string;
  username?: string;
}

interface TelegramLoginResponse {
  exists: boolean;
  userInfo: TelegramUserInfo;
}

export interface RegisterPayload {
  telegramId: string;
  fullName: string;
  is_teacher: boolean;
  telegram_username?: string;
  email?: string;
  birthDate?: Date | null;
}

const LOGIN_FUNCTION = import.meta.env.DEV
  ? "telegram-login-test"
  : "telegram-login";

// Edge-функції повертають текст помилки в тілі відповіді
const unwrapFunctionError = async (error: unknown) => {
  if (error instanceof FunctionsHttpError) {
    const body = await error.context.json().catch(() => null);
    if (body) return new Error(JSON.stringify(body));
  }
  return error;
};

// Перевіряє initData від Telegram і повідомляє, чи зареєстрований користувач
export const telegramLogin = async (
  initData: string,
): Promise<TelegramLoginResponse> => {
  const { data, error } = await supabase.functions.invoke(LOGIN_FUNCTION, {
    body: { initData },
  });

  if (error) throw await unwrapFunctionError(error);

  return typeof data === "string" ? JSON.parse(data) : data;
};

export const registerUser = async (userData: RegisterPayload) => {
  const { error } = await supabase.functions.invoke("register", {
    body: { userData },
  });

  if (error) throw await unwrapFunctionError(error);
};

// Акаунти створюються edge-функцією register з такими ж email і паролем
export const signInWithTelegram = async (telegramId: string | number) => {
  const { error } = await supabase.auth.signInWithPassword({
    email: `tg_${telegramId}@example.com`,
    password: String(telegramId),
  });

  if (error) throw error;
};
