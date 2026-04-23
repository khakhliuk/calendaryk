<template>
  <div class="bg-gray-50">
    <div class="bg-white px-4 py-3">
      <h1 class="text-lg font-semibold text-gray-900">Мої керівники</h1>
    </div>

    <!-- Cards -->
    <div class="px-4 mt-2 flex flex-col gap-1">
      <div
        v-for="teacher in teachers"
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
          @click="openTelegram(teacher.telegram_username)"
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
import { supabase } from "../lib/supabaseClient.js";
import { useMiniApp } from "vue-tg";

const miniApp = useMiniApp();

const teachers = ref<
  {
    name: string;
    email: string;
    telegram_id: string;
    telegram_username: string;
  }[]
>([]);

const getInitials = (name: string) => {
  if (!name) return "-";
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
};

onMounted(async () => {
  await getData();
});

const getData = async () => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: relations } = await supabase
      .from("teachers_students")
      .select("teacher_id")
      .eq("student_id", user.id);

    if (!relations?.length) return;

    const teacherIds = relations.map((r) => r.teacher_id);

    const { data } = await supabase
      .from("users")
      .select("name, email, telegram_id, telegram_username")
      .in("user_id", teacherIds);

    if (data) teachers.value = data;
    console.log(data);
  } catch (er) {
    console.error(er);
  }
};

const openTelegram = (username: string) => {
  miniApp.openTelegramLink(`https://t.me/${username}`);
};
</script>
