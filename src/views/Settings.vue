<template>
  <div class="bg-gray-50" @click="closeKeyboard">
    <div class="px-4 py-2">
      <h1 class="text-lg font-semibold text-gray-900">Налаштування</h1>
    </div>

    <div class="mx-4 mt-1">
      <p
        class="text-xs font-medium text-gray-500 uppercase tracking-widest mb-2 px-1"
      >
        Профіль
      </p>
      <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div class="px-4 py-2 flex flex-col gap-1">
          <label class="text-xs text-gray-500">Ім'я</label>
          <InputText
            v-model="form.name"
            placeholder="Введіть ваше ім'я"
            class="w-full"
            :pt="underlineInputPt"
          />
        </div>
        <div class="px-4 py-3 flex flex-col gap-1">
          <label class="text-xs text-gray-500">Email</label>
          <InputText
            v-model="form.email"
            placeholder="Введіть Email"
            class="w-full"
            :pt="underlineInputPt"
          />
        </div>
      </div>
    </div>

    <div class="mx-4 mt-4">
      <p
        class="text-xs font-medium text-gray-500 uppercase tracking-widest mb-2 px-1"
      >
        Сповіщення
      </p>
      <div
        class="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-100"
      >
        <div class="px-4 py-4 flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-800">
              Нагадування про заняття
            </p>
            <p class="text-xs text-gray-500 mt-0.5">
              Отримувати сповіщення перед початком
            </p>
          </div>
          <ToggleSwitch v-model="form.notificationsEnabled" />
        </div>

        <Transition name="fade">
          <div v-if="form.notificationsEnabled" class="px-4 py-4">
            <p class="text-sm font-medium text-gray-800 mb-3">
              За скільки хвилин
            </p>
            <div class="flex gap-2 flex-wrap">
              <button
                v-for="option in minuteOptions"
                :key="option"
                @click="form.notifyMinutesBefore = option"
                class="px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
                :class="
                  form.notifyMinutesBefore === option
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600'
                "
              >
                {{ option }} хв
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </div>

    <div class="mx-4 mt-6">
      <Button
        label="Зберегти"
        severity="info"
        raised
        :loading="saving"
        :disabled="!hasChanges"
        class="w-full"
        @click="save"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useBackButton } from "vue-tg";
import { createSupabaseDbClient } from "../lib/supabaseClient";
import { getCurrentUserId } from "../lib/session";
import { useNotify } from "../composables/useNotify";
import type { UserSettings } from "../models/userSettings";

interface SettingsForm {
  name: string;
  email: string;
  notificationsEnabled: boolean;
  notifyMinutesBefore: number;
}

const DEFAULT_NOTIFY_MINUTES = 15;
const minuteOptions = [5, 15, 30, 60];

const underlineInputPt = {
  root: {
    class:
      "border-0 border-b border-gray-200 rounded-none px-0 text-gray-900 text-sm focus:ring-0 focus:border-blue-400 bg-transparent w-full pb-1 caret-gray-500",
  },
};

const supabase = createSupabaseDbClient();
const router = useRouter();
const notify = useNotify();

const backButton = useBackButton();
backButton?.show?.();
backButton?.onClick?.(() => router.back());

const saving = ref(false);
const form = ref<SettingsForm>({
  name: "",
  email: "",
  notificationsEnabled: false,
  notifyMinutesBefore: DEFAULT_NOTIFY_MINUTES,
});
// Останній збережений стан - з ним порівнюємо форму
const savedForm = ref<SettingsForm>({ ...form.value });

const hasChanges = computed(
  () => JSON.stringify(form.value) !== JSON.stringify(savedForm.value),
);

onMounted(async () => {
  saving.value = true;
  try {
    const userId = getCurrentUserId();

    const [userRes, settingsRes] = await Promise.all([
      supabase.from("users").select("name, email").eq("user_id", userId).single(),
      supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle<UserSettings>(),
    ]);

    if (userRes.error) throw userRes.error;
    if (settingsRes.error) throw settingsRes.error;

    form.value = {
      name: userRes.data.name ?? "",
      email: userRes.data.email ?? "",
      notificationsEnabled: settingsRes.data?.enable_notification ?? false,
      notifyMinutesBefore:
        settingsRes.data?.notification_timing ?? DEFAULT_NOTIFY_MINUTES,
    };
    savedForm.value = { ...form.value };
  } catch (error) {
    notify.error("Помилка отримання даних", error);
  } finally {
    saving.value = false;
  }
});

const save = async () => {
  saving.value = true;
  try {
    const userId = getCurrentUserId();

    const { error: userError } = await supabase
      .from("users")
      .update({ name: form.value.name, email: form.value.email })
      .eq("user_id", userId);

    if (userError) throw userError;

    const { error: settingsError } = await supabase
      .from("user_settings")
      .update({
        enable_notification: form.value.notificationsEnabled,
        notification_timing: form.value.notifyMinutesBefore,
      })
      .eq("user_id", userId);

    if (settingsError) throw settingsError;

    savedForm.value = { ...form.value };
    notify.success("Збережено");
  } catch (error) {
    notify.error("Помилка збереження", error);
  } finally {
    saving.value = false;
  }
};

// Ховаємо клавіатуру в Telegram при тапі повз поле вводу
const closeKeyboard = (e: Event) => {
  const target = e.target as HTMLElement;
  if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
    (document.activeElement as HTMLElement | null)?.blur();
  }
};
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.2s,
    transform 0.2s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
