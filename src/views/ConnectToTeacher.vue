<template>
  <div class="flex items-center justify-center p-6">
    <div class="w-full max-w-md">
      <!-- Header -->
      <div class="mb-3 text-center">
        <div
          class="inline-flex items-center justify-center w-14 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 mb-3"
        >
          <i class="pi pi-link text-indigo-400 text-2xl" />
        </div>
        <h2 class="text-1xl font-semibold tracking-tight">
          Під'єднання до керівника
        </h2>
        <p class="text-2xl font-semibold tracking-tight">
          {{ form.teacherName }}
        </p>
        <p v-if="!isUserRegistered" class="text-sm leading-relaxed mt-2">
          Введіть ваші дані:
        </p>
      </div>

      <!-- Card -->
      <div class="rounded-2xl border border-slate-800 p-6 shadow-2xl space-y-4">
        <div v-if="!isUserRegistered" class="flex flex-col gap-5">
          <!-- ПІБ -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-medium uppercase tracking-widest">
              Повне ім'я
            </label>
            <InputText
              v-model="form.fullName"
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

          <!-- Email -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-medium uppercase tracking-widest">
              Email
            </label>
            <InputText
              v-model="form.email"
              type="email"
              placeholder="example@email.com"
              class="w-full"
              :pt="{
                root: {
                  class:
                    'bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm w-full',
                },
              }"
            />
          </div>

          <!-- Дата народження -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-medium uppercase tracking-widest">
              Дата народження
            </label>
            <DatePicker
              v-model="form.birthDate"
              placeholder="дд.мм.рррр"
              dateFormat="dd.mm.yy"
              :showIcon="true"
              class="w-full"
              :pt="{
                input: {
                  class:
                    'bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm w-full',
                },
                dropdownButton: {
                  class:
                    'bg-slate-800/60 border-slate-700 text-slate-400 rounded-r-xl border-l-0',
                },
              }"
            />
          </div>
        </div>

        <!-- Button -->
        <Button
          severity="info"
          label="Під'єднатись"
          icon="pi pi-arrow-right"
          iconPos="right"
          :loading="loading"
          @click="handleConnect"
          class="w-full"
          :pt="{
            root: {
              class:
                'bg-indigo-600 hover:bg-indigo-500 border-0 text-white font-medium rounded-xl px-4 text-sm transition-all duration-200 w-full justify-center flex items-center',
            },
          }"
        />
        <!-- Footer note -->
        <p
          v-if="!isUserRegistered"
          class="text-center text-slate-600 text-xs mt-6"
        >
          Ваші дані потрібні лише для керівника
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useMiniApp } from "vue-tg";
import { supabase } from "../lib/supabaseClient";
import { useNotify } from "../composables/useNotify";
import {
  registerUser,
  signInWithTelegram,
  telegramLogin,
  type TelegramUserInfo,
} from "../services/auth";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const route = useRoute();
const router = useRouter();
const miniApp = useMiniApp();
const notify = useNotify();

const loading = ref(false);
const telegramUser = ref<TelegramUserInfo | null>(null);
const isUserRegistered = ref(false);

const teacherId = computed(() =>
  typeof route.query.id === "string" ? route.query.id : null,
);

const form = ref({
  teacherName: "",
  fullName: "",
  email: "",
  birthDate: null as Date | null,
});

const isFormValid = () => {
  const { fullName, email, birthDate } = form.value;
  return !!fullName.trim() && EMAIL_REGEX.test(email) && !!birthDate;
};

const handleConnect = async () => {
  if (!telegramUser.value) return;

  if (!isUserRegistered.value && !isFormValid()) {
    notify.warn("Будь ласка, заповніть всі поля коректно.");
    return;
  }

  loading.value = true;
  try {
    if (!isUserRegistered.value) {
      await registerUser({
        telegramId: String(telegramUser.value.id),
        fullName: form.value.fullName.trim(),
        email: form.value.email,
        birthDate: form.value.birthDate,
        is_teacher: false,
        telegram_username: telegramUser.value.username,
      });
    }

    await signInAndConnect(telegramUser.value.id);
    router.push("/dashboard");
  } catch (error) {
    notify.error("Не вдалося під'єднатись", error);
  } finally {
    loading.value = false;
  }
};

const signInAndConnect = async (telegramId: string | number) => {
  await signInWithTelegram(telegramId);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Користувача не знайдено");

  const { error } = await supabase.from("teachers_students").insert({
    teacher_id: teacherId.value,
    student_id: user.id,
  });

  if (error) throw error;
};

const isAlreadyConnected = async (telegramId: string | number) => {
  const { data: student, error } = await supabase
    .from("users")
    .select("user_id")
    .eq("telegram_id", telegramId)
    .maybeSingle();

  if (error) throw error;
  if (!student) return false;

  const { data: relations, error: relationError } = await supabase
    .from("teachers_students")
    .select("id")
    .eq("teacher_id", teacherId.value)
    .eq("student_id", student.user_id);

  if (relationError) throw relationError;

  return !!relations?.length;
};

const loadData = async () => {
  try {
    loading.value = true;

    const { data: teacher, error } = await supabase
      .from("users")
      .select("name")
      .eq("user_id", teacherId.value)
      .maybeSingle();

    if (error) throw error;
    if (!teacher) {
      router.push({ name: "NotFound" });
      return;
    }

    form.value.teacherName = teacher.name;

    const { exists, userInfo } = await telegramLogin(miniApp.initData);
    telegramUser.value = userInfo;
    isUserRegistered.value = exists;

    if (exists && (await isAlreadyConnected(userInfo.id))) {
      notify.warn("Ви вже приєднані до цього керівника!");
      router.push("/");
    }
  } catch (error) {
    notify.error("Помилка завантаження", error);
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  if (!teacherId.value) {
    router.push({ name: "NotFound" });
    return;
  }

  await loadData();
});
</script>
