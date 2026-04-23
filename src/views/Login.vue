<template>
  <div
    v-if="!loading"
    class="min-h-screen bg-white flex items-center justify-center px-4"
  >
    <div class="w-full max-w-md text-center">
      <h1 class="text-3xl font-normal text-gray-800 mb-2">Вітаємо!</h1>
      <p class="text-gray-600 mb-3">Ви збираєтесь продовжити реєстрацію як:</p>
      <SelectButton v-model="value" :options="options" class="mb-5" />

      <div v-if="value === 'Керівник'" class="space-y-4">
        <button
          @click="register()"
          class="w-full px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium mb-8"
        >
          Зареєструватись як Керівник
        </button>
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
    <p class="text-gray-600 mb-8">Завантаження...</p>
    <p class="text-gray-600 mb-8">{{ dopinfo }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { supabase } from "../lib/supabaseClient.js";
import router from "../router/index.js";

import { useMiniApp } from "vue-tg";
const miniApp = useMiniApp();
import { useToast } from "primevue/usetoast";
const toast = useToast();

const telegramId = ref<string>("");
const telegramuUsername = ref<string>("");
const loading = ref(true);
const value = ref("Керівник");
const options = ref(["Керівник", "Учень"]);

const dopinfo = ref("");

const login = async () => {
  try {
    const { data: loginData, error } = await supabase.functions.invoke(
      "telegram-login",
      {
        body: {
          initData: miniApp.initData,
        },
      },
    );
    console.log("miniApp.initData", miniApp.initData);

    if (error) {
      throw error;
    }

    const parsed = JSON.parse(loginData);
    const user = parsed.userInfo;
    telegramId.value = user.id;
    telegramuUsername.value = user.username;

    if (miniApp.initDataUnsafe.start_param) {
      const startParam = miniApp.initDataUnsafe.start_param;
      const [action, teacherId] = startParam.split("_");

      switch (action) {
        case "connect":
          router.push(
            `/connect?id=${teacherId}&telegramId=${telegramId.value}&username=${user.username}`,
          );
      }
    } else {
      if (parsed.exists) {
        await signInAndProceed();
      } else {
        loading.value = false;
      }
    }
  } catch (e) {
    dopinfo.value = e as string;
    toast.add({
      severity: "error",
      summary: "Помилка: \n" + e,
      life: 3000,
    });
  }
};

const register = async () => {
  try {
    const { error } = await supabase.functions.invoke("register", {
      body: {
        userData: {
          telegramId: telegramId.value,
          is_teacher: true,
          telegram_username: telegramuUsername.value,
        },
      },
    });

    if (error) {
      return;
    }

    signInAndProceed();
  } catch (er) {
    toast.add({
      severity: "error",
      summary: "Помилка: \n" + er,
      life: 3000,
    });
  }
};

const signInAndProceed = async () => {
  const { error } = await supabase.auth.signInWithPassword({
    email: `tg_${telegramId.value}@example.com`,
    password: String(telegramId.value),
  });

  if (!error) {
    router.push("/dashboard");
  }
};

onMounted(async () => {
  await login();
});
</script>

<style scoped></style>
