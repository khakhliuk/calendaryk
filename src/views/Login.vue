<template>
  <div
    v-if="!loading"
    class="min-h-screen bg-white flex items-center justify-center px-4"
  >
    <div class="w-full max-w-md text-center justify-between">
      <div>
        <h1 class="text-3xl font-normal text-gray-800 mb-2">Вітаємо!</h1>
        <p class="text-gray-600 mb-3">
          Ви збираєтесь продовжити реєстрацію як:
        </p>
        <SelectButton v-model="role" :options="ROLES" class="mb-5" />
      </div>

      <div v-if="role === TEACHER_ROLE" class="space-y-2">
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-medium uppercase tracking-widest">
            Повне ім'я
          </label>
          <InputText
            v-model="username"
            placeholder="Прізвище Ім'я По-батькові"
            class="w-full"
            :pt="{
              root: {
                class:
                  'bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm w-full',
              },
            }"
          />
        </div>
        <Button
          @click="registerTeacher"
          severity="info"
          class="w-full px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mb-8"
        >
          <div class="flex flex-col items-center justify-center">
            <span class="text-lg font-medium">Продовжити як Керівник</span>
          </div>
        </Button>
        <span class="text-gray-600">(Безкоштовний період 14 днів)</span>
      </div>
      <p v-else class="text-gray-600 mb-8">
        Якщо ви хочете підключитись як <b>УЧЕНЬ</b> - зверніться до керівника за
        посиланням!
      </p>
    </div>
  </div>
  <div
    v-else
    class="min-h-screen bg-white flex items-center justify-center px-4"
  >
    <p class="text-gray-600 mb-8">{{ errorText || "Завантаження..." }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useMiniApp } from "vue-tg";
import { isTeacher } from "../lib/session";
import { useNotify } from "../composables/useNotify";
import {
  registerUser,
  signInWithTelegram,
  telegramLogin,
  type TelegramUserInfo,
} from "../services/auth";
import { getErrorMessage } from "../utils/strings";

const TEACHER_ROLE = "Керівник";
const ROLES = [TEACHER_ROLE, "Учень"];

const router = useRouter();
const miniApp = useMiniApp();
const notify = useNotify();

const telegramUser = ref<TelegramUserInfo | null>(null);
const username = ref("");
const role = ref(TEACHER_ROLE);
const loading = ref(true);
const errorText = ref("");

const signInAndProceed = async () => {
  if (!telegramUser.value) return;

  await signInWithTelegram(telegramUser.value.id);
  router.push("/dashboard");
};

// Посилання-запрошення від вчителя має вигляд startapp=connect_<teacherId>
const handleStartParam = async (startParam: string) => {
  const [action, teacherId] = startParam.split("_");
  if (action !== "connect" || !telegramUser.value) return;

  if (isTeacher.value) {
    await signInAndProceed();
    return;
  }

  miniApp.initDataUnsafe.start_param = "";
  router.push({
    name: "ConnectToTeacher",
    query: {
      id: teacherId,
      telegramId: String(telegramUser.value.id),
      username: telegramUser.value.username,
    },
  });
};

const login = async () => {
  try {
    const { userInfo, exists } = await telegramLogin(miniApp.initData);
    telegramUser.value = userInfo;

    const startParam = miniApp.initDataUnsafe.start_param;
    if (startParam) {
      await handleStartParam(startParam);
    } else if (exists) {
      await signInAndProceed();
    } else {
      loading.value = false;
    }
  } catch (error) {
    errorText.value = getErrorMessage(error);
    notify.error("Помилка входу", error);
  }
};

const registerTeacher = async () => {
  if (!telegramUser.value) return;

  if (!username.value.trim()) {
    notify.warn("Введіть ваше ім'я");
    return;
  }

  try {
    await registerUser({
      telegramId: String(telegramUser.value.id),
      is_teacher: true,
      telegram_username: telegramUser.value.username,
      fullName: username.value.trim(),
    });
    await signInAndProceed();
  } catch (error) {
    notify.error("Помилка реєстрації", error);
  }
};

onMounted(login);
</script>
