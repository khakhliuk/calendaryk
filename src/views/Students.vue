<template>
  <div>
    <div class="px-4 py-2">
      <!-- <div class="flex space-x-2 mb-2">
        <button
          @click="activeTab = 'all'"
          class="flex-1 py-2 px-4 rounded-lg font-medium transition-colors"
          :class="
            activeTab === 'all'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'bg-transparent text-gray-600'
          "
        >
          Учні
        </button>
        <button
          @click="activeTab = 'groups'"
          class="flex-1 py-2 px-4 rounded-lg font-medium transition-colors"
          :class="
            activeTab === 'groups'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'bg-transparent text-gray-600'
          "
        >
          Групи
        </button>
      </div> -->

      <div class="mb-2 relative">
        <IconField>
          <InputIcon class="pi pi-search" />
          <InputText
            v-model="searchQuery"
            placeholder="Пошук..."
            class="w-full"
          />
          <InputIcon
            v-if="searchQuery"
            class="pi pi-times cursor-pointer"
            @click="searchQuery = ''"
          />
        </IconField>
      </div>
      <div class="space-y-3" v-if="activeTab === 'all'">
        <div class="flex flex-row items-center justify-between">
          <h1 class="text-xl font-bold text-gray-900">
            Мої учні ({{ students.length }})
          </h1>
          <Button
            severity="info"
            label="Запросити"
            icon="pi pi-envelope"
            size="small"
            rounded
            @click="share()"
          />
        </div>

        <div
          v-if="students.length !== 0"
          v-for="student in filteredStudents"
          :key="student.telegram_id"
          :class="{ 'border-gray-300': !student.is_active }"
          class="bg-white rounded-lg py-1 px-3 shadow-sm border-l-4 border-blue-300 space-y-2"
        >
          <div class="flex flex-row justify-between items-center">
            <div class="w-5/6 space-y-1">
              <div class="flex items-center space-x-3 flex-1 min-w-0">
                <div
                  :class="student.is_active ? 'bg-blue-500' : 'bg-gray-500'"
                  class="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-semibold flex-shrink-0"
                >
                  {{ getInitials(student.name) }}
                </div>
                <div class="min-w-0 flex-1">
                  <h3 class="font-semibold text-gray-900 truncate">
                    {{ student.name }}
                  </h3>
                </div>
              </div>
              <div class="flex flex-row justify-between">
                <div class="flex flex-col justify-between">
                  <div class="flex flex-row items-center text-sm text-gray-600">
                    <span class="mr-2">✉️</span>
                    <div
                      class="flex items-center"
                      @click="copyToClipboard(student.email)"
                    >
                      <span>{{ student.email }}</span>
                      <i
                        class="pi pi-copy ml-1 text-blue-400"
                        style="font-size: 1rem"
                      ></i>
                    </div>
                  </div>
                  <div class="flex items-center text-sm text-gray-600">
                    <span class="mr-2">🎉</span>
                    <span>{{
                      format(student.birthday, "d MMMM, yyyy", { locale: uk })
                    }}</span>
                  </div>
                </div>
              </div>
              <Button
                icon="pi pi-send"
                size="small"
                rounded
                label="Відкрити чат"
                text
                severity="info"
                iconPos="right"
                @click="openTelegram(student.telegram_username)"
              />
            </div>
            <i
              class="pi pi-angle-right w-1/6 pl-6"
              style="font-size: 1.5rem"
              @click="openEditStudent(student.user_id)"
            ></i>
          </div>
        </div>

        <div v-else class="text-center py-10">
          <p class="text-gray-500">У вас ще немає учнів.</p>
          <p class="text-gray-500">Запросіть їх, щоб почати!</p>
        </div>
      </div>

      <!-- Groups List -->
      <div class="space-y-3" v-else>
        <div class="flex flex-row items-center justify-between">
          <h1 class="text-xl font-bold text-gray-900">
            Мої групи ({{ groups.length }})
          </h1>
          <Button
            severity="info"
            label="Створити"
            icon="pi pi-plus"
            size="small"
            rounded
            @click="openCreateGroup"
          />
        </div>

        <div
          v-if="groups.length !== 0"
          v-for="group in filteredGroups"
          :key="group.id"
          class="bg-white rounded-lg p-4 shadow-sm border-l-4 border-green-300"
          @click="openEditGroup(group.id)"
        >
          <div class="flex flex-row justify-between items-center">
            <div class="flex flex-col">
              <div class="min-w-0 flex flex-row">
                <h4></h4>
                <h1 class="font-semibold text-gray-900 truncate">
                  <i class="pi pi-users mr-1" style="font-size: 1rem"></i>
                  {{ group.title }}
                </h1>
              </div>

              <div class="flex items-center space-x-4 my-1">
                <span v-if="group.schedule.length > 0">
                  {{ formatSchedule(group.schedule) }}
                </span>
                <span v-else class="text-red-400">Без розкладу</span>
              </div>

              <div class="space-y-2">
                <div class="flex flex-row justify-between">
                  <div class="flex items-center text-sm text-gray-600">
                    <span
                      >{{ group.group_members.length }}
                      {{
                        group.group_members.length === 1
                          ? "учасник"
                          : "учасників"
                      }}</span
                    >
                  </div>
                </div>
              </div>
            </div>

            <i class="pi pi-angle-right" style="font-size: 1.5rem"></i>
          </div>
        </div>
        <div v-else class="text-center py-10">
          <p class="text-gray-500">У вас ще немає груп.</p>
          <p class="text-gray-500">Створіть, щоб почати!</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { supabase } from "../lib/supabaseClient.js";
import { format } from "date-fns";
import { uk } from "date-fns/locale";
import { useRoute, useRouter } from "vue-router";
import type { TeacherStudentsGet } from "../models/teacherStudentsGet.js";
import type { GetGroupModel } from "../models/getGroupsModel.js";
import type { Schedule } from "../models/schedule.js";
import { useToast } from "primevue/usetoast";
import { useMiniApp } from "vue-tg";
import { useBackButton } from "vue-tg";
const backButton = useBackButton();
backButton?.hide?.();

const miniApp = useMiniApp();
const toast = useToast();
const route = useRoute();

const selectedTabType = computed(
  () => route.params.activeTab as "all" | "groups",
);

const activeTab = ref<"all" | "groups">(
  selectedTabType.value ? selectedTabType.value : "all",
);

const router = useRouter();
const students = ref<TeacherStudentsGet[]>([]);
const groups = ref<GetGroupModel[]>([]);

onMounted(async () => {
  await getData();
});

const getInitials = (name: string): string => {
  if (!name) return "";
  return name
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
};

const searchQuery = ref("");

const filteredStudents = computed(() => {
  if (!searchQuery.value.trim()) {
    return students.value;
  }

  const query = searchQuery.value.toLowerCase();

  return students.value.filter(
    (student) =>
      student.name.toLowerCase().includes(query) ||
      student.email?.toLowerCase().includes(query),
  );
});

const filteredGroups = computed(() => {
  if (!searchQuery.value.trim()) {
    return groups.value;
  }

  const query = searchQuery.value.toLowerCase();

  return groups.value.filter((group) =>
    group.title.toLowerCase().includes(query),
  );
});

function formatSchedule(schedules: Schedule[]): string {
  if (!schedules || schedules.length === 0) return "";

  const timeGroups = new Map<string, Set<number>>();

  schedules.forEach((schedule) => {
    const date = new Date(schedule.start_date);
    const time = date.toLocaleTimeString("uk-UA", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const dayOfWeek = date.getDay();

    if (!timeGroups.has(time)) {
      timeGroups.set(time, new Set());
    }
    timeGroups.get(time)!.add(dayOfWeek);
  });

  const dayNames = ["Нд", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

  const result = Array.from(timeGroups.entries()).map(([time, days]) => {
    const sortedDays = Array.from(days).sort((a, b) => a - b);
    const dayLabels = sortedDays.map((day) => dayNames[day]).join(", ");
    return `${dayLabels} - ${time}`;
  });

  return result.join("; ");
}

const openCreateGroup = async () => {
  router.push({ name: "GroupEdit" });
};

const openEditGroup = async (groupId: string) => {
  router.push({
    name: "GroupEdit",
    params: { id: groupId },
  });
};

const openEditStudent = async (studentId: string) => {
  router.push({
    name: "StudentEdit",
    params: { id: studentId },
  });
};

const getData = async () => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: relations, error: relError } = await supabase
      .from("teachers_students")
      .select("id, student_id")
      .eq("teacher_id", user!.id);

    if (relError) {
      throw relError;
    }

    if (!relations || relations.length === 0) {
      students.value = [];
      return;
    }

    const studentIds = relations.map((r) => r.student_id);

    const { data: studentsData, error: studError } = await supabase
      .from("users")
      .select("*")
      .in("user_id", studentIds)
      .order("name");

    if (studError) {
      throw studError;
    }

    if (studentsData) {
      students.value = studentsData;
    }

    const { data: groupsData, error: groupError } = await supabase
      .from("groups")
      .select(
        `
    *,
      group_members(*),
      schedule!group_id(*)
    `,
      )
      .eq("teacher_id", user!.id)
      .order("title");

    if (groupError) {
      throw groupError;
    }

    if (groupsData) {
      groups.value = groupsData;
    }
  } catch (er) {
    toast.add({
      severity: "error",
      summary: "Помилка: \n" + er,
      life: 3000,
    });
  }
};

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const el = document.createElement("textarea");
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
  } finally {
    toast.add({ severity: "success", summary: "Зкопійовано", life: 2000 });
  }
};

const openTelegram = (username: string) => {
  miniApp.openTelegramLink(`https://t.me/${username}`);
};

const share = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: userData, error } = await supabase
    .from("users")
    .select()
    .eq("user_id", user!.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const text = `📚 Приєднуйтесь до керівника ${userData.name}`;
  const link = `https://t.me/calendarykTestBot?startapp=connect_${user!.id}`;
  const url = encodeURIComponent(link);
  const encodedText = encodeURIComponent(text);
  miniApp.openTelegramLink(
    `https://t.me/share/url?url=${url}&text=${encodedText}`,
  );
};
</script>
