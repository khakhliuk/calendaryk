<template>
  <div class="px-4 py-2">
    <div class="mb-2 relative">
      <IconField>
        <InputIcon class="pi pi-search" />
        <InputText v-model="searchQuery" placeholder="Пошук..." class="w-full" />
        <InputIcon
          v-if="searchQuery"
          class="pi pi-times cursor-pointer"
          @click="searchQuery = ''"
        />
      </IconField>
    </div>

    <div v-if="activeTab === 'students'" class="space-y-3">
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
          @click="shareInviteLink"
        />
      </div>

      <template v-if="students.length">
        <div
          v-for="student in filteredStudents"
          :key="student.user_id"
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
                <h3 class="min-w-0 flex-1 font-semibold text-gray-900 truncate">
                  {{ student.name }}
                </h3>
              </div>

              <div class="flex flex-col text-sm text-gray-600">
                <div class="flex flex-row items-center">
                  <span class="mr-2">✉️</span>
                  <div
                    class="flex items-center"
                    @click="copyToClipboard(student.email)"
                  >
                    <span>{{ student.email }}</span>
                    <i class="pi pi-copy ml-1 text-blue-400 text-base" />
                  </div>
                </div>
                <div v-if="student.birthday" class="flex items-center">
                  <span class="mr-2">🎉</span>
                  <span>
                    {{ format(student.birthday, "d MMMM, yyyy", { locale: uk }) }}
                  </span>
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
                @click="openTelegramChat(student.telegram_username)"
              />
            </div>
            <i
              class="pi pi-angle-right w-1/6 pl-6"
              style="font-size: 1.5rem"
              @click="openStudent(student.user_id)"
            />
          </div>
        </div>
      </template>

      <div v-else class="text-center py-10">
        <p class="text-gray-500">У вас ще немає учнів.</p>
        <p class="text-gray-500">Запросіть їх, щоб почати!</p>
      </div>
    </div>

    <div v-else class="space-y-3">
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
          @click="openGroup()"
        />
      </div>

      <template v-if="groups.length">
        <div
          v-for="group in filteredGroups"
          :key="group.id"
          class="bg-white rounded-lg p-4 shadow-sm border-l-4 border-green-300"
          @click="openGroup(group.id)"
        >
          <div class="flex flex-row justify-between items-center">
            <div class="flex flex-col">
              <h2 class="font-semibold text-gray-900 truncate">
                <i class="pi pi-users mr-1 text-base" />
                {{ group.title }}
              </h2>

              <div class="my-1">
                <span v-if="group.schedule.length">
                  {{ formatSchedule(group.schedule) }}
                </span>
                <span v-else class="text-red-400">Без розкладу</span>
              </div>

              <span class="text-sm text-gray-600">
                {{ group.group_members.length }}
                {{ group.group_members.length === 1 ? "учасник" : "учасників" }}
              </span>
            </div>

            <i class="pi pi-angle-right" style="font-size: 1.5rem" />
          </div>
        </div>
      </template>

      <div v-else class="text-center py-10">
        <p class="text-gray-500">У вас ще немає груп.</p>
        <p class="text-gray-500">Створіть, щоб почати!</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useBackButton, useMiniApp } from "vue-tg";
import { format } from "date-fns";
import { uk } from "date-fns/locale";
import { createSupabaseDbClient } from "../lib/supabaseClient";
import { getCurrentUserId } from "../lib/session";
import { useNotify } from "../composables/useNotify";
import { fetchTeacherStudents } from "../services/students";
import { getInitials } from "../utils/strings";
import { SHORT_DAY_NAMES } from "../utils/date";
import type { User } from "../models/user";
import type { GetGroupModel } from "../models/getGroupsModel";
import type { Schedule } from "../models/schedule";

const BOT_LINK = "https://t.me/CalendarykBot";

const supabase = createSupabaseDbClient();
const miniApp = useMiniApp();
const notify = useNotify();
const route = useRoute();
const router = useRouter();

const backButton = useBackButton();
backButton?.hide?.();

// Перемикач вкладок поки прихований, групи відкриваються через ?tab=groups
const activeTab = computed(() =>
  route.query.tab === "groups" ? "groups" : "students",
);

const students = ref<User[]>([]);
const groups = ref<GetGroupModel[]>([]);
const searchQuery = ref("");

const normalizedQuery = computed(() => searchQuery.value.trim().toLowerCase());

const filteredStudents = computed(() => {
  const query = normalizedQuery.value;
  if (!query) return students.value;

  return students.value.filter(
    (student) =>
      student.name.toLowerCase().includes(query) ||
      student.email?.toLowerCase().includes(query),
  );
});

const filteredGroups = computed(() => {
  const query = normalizedQuery.value;
  if (!query) return groups.value;

  return groups.value.filter((group) =>
    group.title.toLowerCase().includes(query),
  );
});

onMounted(loadData);

async function loadData() {
  try {
    const teacherId = getCurrentUserId();

    const [studentsData, groupsRes] = await Promise.all([
      fetchTeacherStudents(teacherId),
      supabase
        .from("groups")
        .select("*, group_members(*), schedule!group_id(*)")
        .eq("teacher_id", teacherId)
        .order("title"),
    ]);

    if (groupsRes.error) throw groupsRes.error;

    students.value = studentsData;
    groups.value = groupsRes.data ?? [];
  } catch (error) {
    notify.error("Помилка завантаження", error);
  }
}

// "Пн, Ср - 18:00; Пт - 10:00"
function formatSchedule(schedules: Schedule[]): string {
  const daysByTime = new Map<string, Set<number>>();

  schedules.forEach((schedule) => {
    const date = new Date(schedule.start_date);
    const time = format(date, "HH:mm");

    if (!daysByTime.has(time)) {
      daysByTime.set(time, new Set());
    }
    daysByTime.get(time)!.add(date.getDay());
  });

  return Array.from(daysByTime.entries())
    .map(([time, days]) => {
      const dayLabels = Array.from(days)
        .sort((a, b) => a - b)
        .map((day) => SHORT_DAY_NAMES[day])
        .join(", ");
      return `${dayLabels} - ${time}`;
    })
    .join("; ");
}

const openGroup = (groupId?: string) => {
  router.push(
    groupId
      ? { name: "GroupEdit", params: { id: groupId } }
      : { name: "GroupEdit" },
  );
};

const openStudent = (studentId: string) => {
  router.push({ name: "StudentEdit", params: { id: studentId } });
};

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // Фолбек для вебв'ю, де Clipboard API недоступний
    const el = document.createElement("textarea");
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
  }
  notify.success("Скопійовано");
};

const openTelegramChat = (username: string) => {
  miniApp.openTelegramLink(`https://t.me/${username}`);
};

const shareInviteLink = async () => {
  try {
    const teacherId = getCurrentUserId();

    const { data: teacher, error } = await supabase
      .from("users")
      .select("name")
      .eq("user_id", teacherId)
      .single();

    if (error) throw error;

    const text = `📚 Приєднуйтесь до керівника ${teacher.name}`;
    const link = `${BOT_LINK}?startapp=connect_${teacherId}`;

    miniApp.openTelegramLink(
      `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`,
    );
  } catch (error) {
    notify.error("Не вдалося створити запрошення", error);
  }
};
</script>
