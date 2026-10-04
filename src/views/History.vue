<template>
  <div class="px-4 py-2">
    <h2 class="text-lg font-semibold text-gray-900 mb-1">Історія занять</h2>
    <div class="space-y-1">
      <Select
        v-model="selectedStudent"
        :options="allStudents"
        optionLabel="name"
        filter
        showClear
        checkmark
        placeholder="Оберіть учня для фільтрації"
        class="w-full"
      />
      <div class="flex space-x-2">
        <div class="flex-auto mb-1">
          <label for="history-start" class="mb-2 text-sm text-gray-700">
            Дата з
          </label>
          <DatePicker
            v-model="startDate"
            inputId="history-start"
            showIcon
            fluid
            size="small"
            iconDisplay="input"
            dateFormat="dd/mm/yy"
          />
        </div>

        <div class="flex-auto">
          <label for="history-end" class="mb-2 text-sm text-gray-700">
            Дата по
          </label>
          <DatePicker
            v-model="endDate"
            inputId="history-end"
            showIcon
            fluid
            size="small"
            iconDisplay="input"
            dateFormat="dd/mm/yy"
          />
        </div>
      </div>

      <span class="text-sm">
        <span class="text-blue-500 font-medium">
          Відбулось: {{ happenedCount }}
        </span>
        <template v-if="canceledCount > 0">
          <span class="text-gray-400 mx-1">·</span>
          <span class="text-red-500 font-medium">
            Скасовано: {{ canceledCount }}
          </span>
        </template>
      </span>

      <template v-if="filteredLessons.length">
        <div
          v-for="lesson in filteredLessons"
          :key="lesson.students[0].attendance_id"
          class="rounded-lg p-2 text-gray-700 border-l-4 shadow-sm"
          :class="getLessonBorderClass(lesson)"
          @click="openMenu($event, lesson)"
        >
          <div class="flex flex-col justify-between overflow-hidden">
            <div class="flex items-center justify-between">
              <div>
                <i class="pi pi-clock mr-1 text-base" />
                <span>{{ format(lesson.date, "dd.MM.yyyy, HH:mm") }}</span>
              </div>
              <span
                v-if="
                  lesson.students.length === 1 &&
                  lesson.students[0].status === 'canceled'
                "
                class="font-semibold text-red-500 ml-2"
              >
                Скасовано
              </span>
            </div>
            <span v-if="lesson.students.length === 1" class="truncate block">
              {{ lesson.students[0].name }}
            </span>
            <span v-if="lesson.schedule" class="truncate block">
              {{ lesson.schedule.groups?.title }}
            </span>
          </div>
        </div>
      </template>

      <div v-else class="text-center py-10">
        <p class="text-gray-500">Історія за цей період відсутня.</p>
      </div>
    </div>

    <Menu ref="contextMenu" :model="menuItems" popup />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from "vue";
import { useRouter } from "vue-router";
import { endOfDay, format, startOfMonth } from "date-fns";
import type Menu from "primevue/menu";
import { createSupabaseDbClient } from "../lib/supabaseClient";
import { getCurrentUserId } from "../lib/session";
import { useNotify } from "../composables/useNotify";
import { fetchTeacherStudents } from "../services/students";
import type { User } from "../models/user";
import type {
  GetHistoryAttendance,
  GroupedAttendance,
} from "../models/getHistoryAttendance";

const supabase = createSupabaseDbClient();
const router = useRouter();
const notify = useNotify();

const contextMenu = ref<InstanceType<typeof Menu> | null>(null);
const menuLesson = ref<GroupedAttendance | null>(null);

const lessons = ref<GroupedAttendance[]>([]);
const allStudents = ref<User[]>([]);
const selectedStudent = ref<User | null>(null);
const startDate = ref(startOfMonth(new Date()));
const endDate = ref(new Date());

const filteredLessons = computed(() => {
  const student = selectedStudent.value;
  if (!student) return lessons.value;

  return lessons.value.filter((lesson) =>
    lesson.students.some((s) => s.student_id === student.user_id),
  );
});

const happenedCount = computed(
  () => filteredLessons.value.filter((l) => l.status === "happened").length,
);

const canceledCount = computed(
  () => filteredLessons.value.filter((l) => l.status === "canceled").length,
);

const menuItems = [
  {
    label: "Опції",
    items: [
      {
        label: "Відкрити картку учня",
        icon: "pi pi-user",
        command: () => {
          const studentId = menuLesson.value?.students[0]?.student_id;
          if (!studentId) return;

          router.push({ name: "StudentEdit", params: { id: studentId } });
        },
      },
    ],
  },
];

const openMenu = (event: Event, lesson: GroupedAttendance) => {
  menuLesson.value = lesson;
  contextMenu.value?.toggle(event);
};

// Зелений - групове заняття, синій - індивідуальне,
// жовтий - частина учнів була відсутня, червоний - скасоване
const getLessonBorderClass = (lesson: GroupedAttendance) => {
  const { students } = lesson;

  if (students.every((s) => s.status === "happened")) {
    return students.length > 1 ? "border-green-400" : "border-blue-400";
  }
  if (students.some((s) => s.status === "happened")) {
    return "border-yellow-400";
  }
  return "border-red-400 bg-red-50";
};

onMounted(async () => {
  await Promise.all([loadHistory(), loadStudents()]);
});

watch([startDate, endDate], loadHistory);

async function loadStudents() {
  try {
    allStudents.value = await fetchTeacherStudents(getCurrentUserId());
  } catch (error) {
    notify.error("Помилка завантаження учнів", error);
  }
}

async function loadHistory() {
  try {
    const { data, error } = await supabase
      .from("attendances")
      .select(
        `
        id,
        date,
        status,
        student_id,
        note,
        schedule_id,
        users!attendances_student_id_fkey (user_id, name),
        schedule: schedule_id (
          id,
          start_date,
          title,
          group_id,
          groups (id, title)
        )
      `,
      )
      .gte("date", startDate.value.toISOString())
      .lt("date", endOfDay(endDate.value).toISOString())
      .eq("teacher_id", getCurrentUserId())
      .neq("status", "scheduled")
      .order("date", { ascending: false });

    if (error) throw error;

    const records: GetHistoryAttendance[] = (data ?? []).map((d: any) => ({
      id: d.id,
      date: new Date(d.date),
      status: d.status,
      student_id: d.student_id,
      note: d.note,
      schedule_id: d.schedule_id,
      users: Array.isArray(d.users) ? d.users[0] : d.users,
      schedule: Array.isArray(d.schedule) ? d.schedule[0] : d.schedule,
    }));

    lessons.value = groupByLesson(records);
  } catch (error) {
    notify.error("Помилка завантаження історії", error);
  }
}

// Записи відвідуваності одного групового заняття об'єднуються в один елемент
function groupByLesson(records: GetHistoryAttendance[]): GroupedAttendance[] {
  const map = new Map<string, GroupedAttendance>();

  for (const record of records) {
    const { schedule } = record;
    let key: string;

    if (!schedule) {
      key = `single_${record.id}`;
    } else {
      const dateKey = format(record.date, "yyyy-MM-dd");
      const ownerId = schedule.group_id ?? record.student_id;
      key = `${schedule.id}_${ownerId}_${dateKey}`;
    }

    if (!map.has(key)) {
      map.set(key, {
        schedule_id: schedule?.id ?? null,
        schedule,
        date: record.date,
        status: record.status,
        students: [],
      });
    }

    map.get(key)!.students.push({
      attendance_id: record.id,
      student_id: record.student_id,
      name: record.users?.name ?? "",
      status: record.status,
      note: record.note,
    });
  }

  return Array.from(map.values());
}
</script>
