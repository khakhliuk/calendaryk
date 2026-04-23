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
      <!-- <Button
        v-else
        label="На головну"
        severity="info"
        raised
        class="w-full mt-3"
        @click="signInAndConnect(false)"
      /> -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { supabase } from "../lib/supabaseClient.js";
import router from "../router/index.js";

import { useRoute } from "vue-router";
const route = useRoute();
import { useMiniApp } from "vue-tg";
const miniApp = useMiniApp();
import { useToast } from "primevue/usetoast";
const toast = useToast();

const loading = ref(false);
const telegramId = ref("");
const isUserRegistered = ref(false);

const connectTeacherId = computed(() =>
  route.query.id ? (route.query.id as string) : null,
);

const form = ref({
  teacherName: "",
  fullName: "",
  email: "",
  birthDate: null as Date | null,
});

const handleConnect = async () => {
  loading.value = true;
  try {
    if (!validateForm()) {
      toast.add({
        severity: "warning",
        summary: "Будь ласка, заповніть всі поля коректно.",
        life: 4000,
      });
      return;
    }

    await register();
  } catch (e) {
    toast.add({
      severity: "error",
      summary: "Помилка: \n" + e,
      life: 3000,
    });
  } finally {
    loading.value = false;
  }
};

const register = async () => {
  try {
    const { data: loginData, error: userError } =
      await supabase.functions.invoke("telegram-login", {
        body: {
          initData: miniApp.initData,
        },
      });

    if (userError) {
      throw userError;
    }

    const parsed = JSON.parse(loginData);
    const user = parsed.userInfo;
    telegramId.value = user.id;

    const { error } = await supabase.functions.invoke("register", {
      body: JSON.stringify({
        userData: {
          telegramId: String(user.id),
          fullName: form.value.fullName,
          email: form.value.email,
          birthDate: form.value.birthDate,
          is_teacher: false,
          telegram_username: user.username,
        },
      }),
    });

    if (error) {
      throw error;
    }

    await signInAndConnect();
  } catch (er) {
    toast.add({
      severity: "error",
      summary: "Помилка: \n" + er,
      life: 3000,
    });
  }
};

const signInAndConnect = async (shouldConnect: boolean = true) => {
  try {
    loading.value = true;
    const email = `tg_${telegramId.value}@example.com`;

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: String(telegramId.value),
    });

    if (shouldConnect) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      await supabase.from("teachers_students").insert({
        teacher_id: connectTeacherId.value,
        student_id: user!.id,
      });

      if (error) {
        throw error;
      }
    }

    router.push("/dashboard");
  } catch (error) {
    console.error(error);
    toast.add({
      severity: "error",
      summary: "Помилка: \n" + error,
      life: 3000,
    });
  } finally {
    loading.value = false;
  }
};

const validateForm = () => {
  if (!form.value.fullName || !form.value.email || !form.value.birthDate) {
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(form.value.email)) {
    return false;
  }
  return true;
};

const prepareData = async () => {
  try {
    loading.value = true;

    const { data: teacherData, error: teacherError } = await supabase
      .from("users")
      .select()
      .eq("user_id", connectTeacherId.value)
      .maybeSingle();

    if (teacherError) {
      throw teacherError;
    }

    form.value.teacherName = teacherData.name;

    const { data: loginData, error: userError } =
      await supabase.functions.invoke("telegram-login", {
        body: {
          initData: miniApp.initData,
        },
      });

    if (userError) {
      const errorBody = await userError.context?.json();
      throw JSON.stringify(errorBody);
    }

    const parsed = JSON.parse(loginData);
    if (parsed.exists) {
      isUserRegistered.value = true;

      const { data: userData, error: userError } = await supabase
        .from("users")
        .select()
        .eq("telegram_id", parsed.userInfo.id)
        .maybeSingle();

      if (userError) {
        throw userError;
      }

      const { data: connectData, error: connectError } = await supabase
        .from("teachers_students")
        .select()
        .eq("teacher_id", connectTeacherId.value)
        .eq("student_id", userData.user_id)
        .maybeSingle();

      if (connectError) {
        throw connectError;
      }

      if (connectData) {
        toast.add({
          severity: "warn",
          summary: "Ви вже приєднані до цього керівника!",
          life: 3000,
        });
        await signInAndConnect(false);
      }
    }
  } catch (error) {
    console.error(error);
    toast.add({
      severity: "error",
      summary: "Помилка: \n" + error,
      life: 3000,
    });
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  if (!connectTeacherId.value) {
    router.push("/404");
    return;
  }

  await prepareData();
});
</script>
