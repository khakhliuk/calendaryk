<template>
  <div class="bg-gray-50">
    <div class="bg-white px-4 py-3">
      <h1 class="text-lg font-semibold text-gray-900">Мої керівники</h1>
    </div>

    <!-- Cards -->
    <div class="px-4 mt-2 flex flex-col gap-1">
      <div
        v-for="teacher in teachers"
        :key="teacher.telegram_id"
        class="bg-white rounded-2xl shadow-sm p-4 flex items-center gap-4"
      >
        <Avatar
          :label="getInitials(teacher.name)"
          shape="circle"
          size="large"
          class="bg-blue-100 text-blue-600 font-semibold shrink-0"
        />
        <div class="flex-1 min-w-0">
          <p class="text-sm font-semibold text-gray-900 truncate">
            {{ teacher.name ?? "Без імені" }}
          </p>
          <p class="text-xs text-gray-400 truncate mt-0.5">
            {{ teacher.email }}
          </p>
        </div>
        <Button
          icon="pi pi-send"
          rounded
          outlined
          severity="info"
          iconPos="right"
          @click="openTelegramChat(teacher.telegram_username)"
        />
      </div>
      <div v-if="!teachers.length" class="text-center py-12 text-gray-400">
        <i class="pi pi-users text-4xl mb-3 block" />
        <p class="text-sm">Вчителів не знайдено</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useBackButton, useMiniApp } from "vue-tg";
import { createSupabaseDbClient } from "../lib/supabaseClient";
import { getCurrentUserId } from "../lib/session";
import { useNotify } from "../composables/useNotify";
import { getInitials } from "../utils/strings";
import type { User } from "../models/user";

type TeacherInfo = Pick<
  User,
  "name" | "email" | "telegram_id" | "telegram_username"
>;

const supabase = createSupabaseDbClient();
const miniApp = useMiniApp();
const notify = useNotify();

const backButton = useBackButton();
backButton?.hide?.();

const teachers = ref<TeacherInfo[]>([]);

onMounted(loadTeachers);

async function loadTeachers() {
  try {
    const { data: relations, error: relationsError } = await supabase
      .from("teachers_students")
      .select("teacher_id")
      .eq("student_id", getCurrentUserId());

    if (relationsError) throw relationsError;
    if (!relations?.length) return;

    const { data, error } = await supabase
      .from("users")
      .select("name, email, telegram_id, telegram_username")
      .in(
        "user_id",
        relations.map((r) => r.teacher_id),
      );

    if (error) throw error;

    teachers.value = data ?? [];
  } catch (error) {
    notify.error("Не вдалося завантажити керівників", error);
  }
}

const openTelegramChat = (username: string) => {
  miniApp.openTelegramLink(`https://t.me/${username}`);
};
</script>
