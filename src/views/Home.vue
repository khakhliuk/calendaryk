<template>
  <div>
    <!-- Date and Stats -->
    <div class="bg-white px-4 py-1 border-b border-gray-200">
      <div class="flex space-x-2">
        <button
          @click="calRef?.switchView('day')"
          class="flex-1 py-2 px-4 rounded-lg font-medium transition-colors shadow-sm"
          :class="
            activeTab === 'day'
              ? 'bg-gray-200 text-gray-900 shadow-sm'
              : 'bg-transparent text-gray-600'
          "
        >
          День
        </button>
        <button
          @click="calRef?.switchView('month')"
          class="flex-1 py-2 px-4 rounded-lg font-medium transition-colors shadow-sm"
          :class="
            activeTab === 'month'
              ? 'bg-gray-200 text-gray-900 shadow-sm'
              : 'bg-transparent text-gray-600'
          "
        >
          Місяць
        </button>
      </div>
    </div>

    <div>
      <div class="h-[calc(100vh-168px)] overflow-hidden">
        <vue-cal
          ref="calRef"
          locale="uk"
          hide-view-selector
          :events="events"
          :time-from="0 * 60"
          :time-to="24 * 60"
          :disable-views="['years', 'year', 'week']"
          style="height: 100%"
          @view-change="updateView"
          @event-click="onEventClick"
        >
          <template #event="{ event }">
            <div
              class="h-full px-2 py-1 flex items-center"
              :class="
                event.status === 'happened'
                  ? 'border-l-4 border-gray-300 bg-gray-100'
                  : event.status === 'canceled'
                    ? 'border-l-4 border-red-300 bg-red-50'
                    : event.class === 'event-group'
                      ? 'border-l-4 border-green-300 bg-green-50'
                      : 'border-l-4 border-blue-300 bg-blue-50'
              "
            >
              <div
                class="text-sm font-medium px-1"
                :class="
                  event.status === 'happened'
                    ? 'text-gray-400 opacity-60'
                    : event.status === 'canceled'
                      ? 'text-red-400 line-through opacity-60'
                      : 'text-gray-800'
                "
              >
                {{ event.title }}
                <span class="text-sm">
                  ({{ format(event.start, "HH:mm", { locale: uk }) }})
                </span>
              </div>
            </div>
          </template>
          <template #cell-content="{ cell, view, events }">
            <div class="vuecal__cell-date">{{ cell.content }}</div>
            <div
              v-if="view.id === 'month' && events.length"
              class="flex flex-wrap justify-center mt-1 gap-0.5"
            >
              <span
                v-for="event in events"
                :key="event.id"
                class="w-1.5 h-1.5 rounded-full"
                :class="
                  event.class === 'event-group' ? 'bg-green-400' : 'bg-blue-400'
                "
              />
            </div>
          </template>
        </vue-cal>
      </div>
      <div v-if="isToday(selectedDate)" class="flex flex-row gap-2 px-3 py-1">
        <div class="flex-1 bg-blue-100 rounded-xl px-2 py-2">
          <div class="flex items-center gap-2">
            <span class="text-xl mb-1">📖</span>
            <p class="text-xl font-semibold text-gray-900">
              {{ upcomingEventsCount }}
            </p>
            <span class="text-sm text-gray-500 mt-1">Занять залишилось</span>
          </div>
        </div>

        <div
          v-if="canceledEventsCount > 0"
          class="flex-1 bg-red-100 rounded-xl px-2 py-2"
        >
          <div class="flex items-center gap-2">
            <span class="text-xl">❌</span>
            <p class="text-xl font-semibold text-gray-900">
              {{ canceledEventsCount }}
            </p>
            <span class="text-sm text-gray-500 mt-1">Скасовано</span>
          </div>
        </div>
      </div>
      <div v-else class="flex flex-row py-1 px-2 space-x-2">
        <Button
          label="Сьогодні"
          severity="info"
          raised
          class="w-full"
          @click="goToToday"
        />
      </div>
    </div>
  </div>
  <EventDetailsModal
    v-model:visible="showModal"
    :event="selectedEvent"
    @submit="updateView"
  />
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import EventDetailsModal from "../components/EventDetailsModal.vue";
import { supabase } from "../lib/supabaseClient.js";
import { format } from "date-fns";
import { uk } from "date-fns/locale";
import { isTeacher } from "../lib/session";
const calRef = ref();

import VueCal from "vue-cal";
import "vue-cal/dist/vuecal.css";
import type { CalEvent } from "../models/getScheduleModel.js";
import { useToast } from "primevue/usetoast";
const toast = useToast();

import { useBackButton } from "vue-tg";
const backButton = useBackButton();
backButton?.hide?.();

const activeTab = ref<"day" | "month">("day");
const events = ref<any[]>([]);
const selectedDate = ref(new Date());

const selectedEvent = ref<CalEvent | null>(null);
const showModal = ref(false);

onMounted(async () => {
  goToToday();
  scrollToCurrent();
});

const upcomingEventsCount = computed(() => {
  return events.value.filter(
    (p) => p.status !== "canceled" && p.status !== "happened",
  ).length;
});

const canceledEventsCount = computed(() => {
  return events.value.filter((p) => p.status === "canceled").length;
});

const scrollToCurrent = () => {
  setTimeout(() => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const totalMinutes = 24 * 60;

    const container = calRef.value?.$el?.querySelector(".vuecal__bg");
    if (!container) return;

    const scrollRatio = currentMinutes / totalMinutes;
    const scrollTop = container.scrollHeight * scrollRatio - 150;

    container.scrollTo({ top: scrollTop, behavior: "smooth" });
  }, 300);
};

const goToToday = () => {
  selectedDate.value = new Date();
  calRef.value?.switchView("day", new Date());
};

const updateView = async (e: {
  view: string;
  startDate: Date;
  endDate: Date;
}) => {
  activeTab.value = e.view as "day" | "month";

  if (e.startDate) selectedDate.value = e.startDate;
  if (!e.startDate || !e.endDate) return;

  await getData(
    format(e.startDate, "yyyy-MM-dd") + "T00:00:00+00:00",
    format(e.endDate, "yyyy-MM-dd") + "T23:59:59+00:00",
  );

  if (e.view === "day") scrollToCurrent();
};

const onEventClick = async (event: CalEvent) => {
  console.log("Clicked event:", event);
  selectedEvent.value = event;
  showModal.value = true;
};

const getData = async (
  startStr = format(new Date(), "yyyy-MM-dd") + "T00:00:00+00:00",
  endStr = format(new Date(), "yyyy-MM-dd") + "T23:59:59+00:00",
) => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: attendances, error: attendanceError } = await supabase
      .from("attendances")
      .select(
        `
        id,
        date,
        status,
        student_id,
        link,
        student:users!attendances_student_id_fkey(user_id, name),
        schedule:schedule!schedule_id(
          id, start_date, title, group_id, is_group,
          group:groups!schedule_group_id_fkey(id, title)
        )
      `,
      )
      .gte("date", startStr)
      .lt("date", endStr)
      .eq(isTeacher.value ? "teacher_id" : "student_id", user!.id);

    if (attendanceError) throw attendanceError;

    const { data: schedules, error: scheduleError } = await supabase
      .from("schedule")
      .select(
        `
        id, title, start_date, is_group, teacher_id, group_id, student_id,
        group:groups!schedule_group_id_fkey(id, title),
        students:users!schedule_student_id_fkey(user_id, name)
      `,
      )
      .eq(isTeacher.value ? "teacher_id" : "student_id", user!.id);

    if (scheduleError) throw scheduleError;

    events.value = buildCalEvents(
      attendances ?? [],
      schedules ?? [],
      new Date(startStr),
      new Date(endStr),
    );
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Помилка: \n" + error,
      life: 3000,
    });
  }
};

function buildCalEvents(
  attendances: any[],
  schedules: any[],
  rangeStart: Date,
  rangeEnd: Date,
): CalEvent[] {
  const map = new Map<string, CalEvent>();
  const realKeys = new Set<string>();

  for (const row of attendances) {
    const schedule = row.schedule;
    const student = row.student;
    const startDate = new Date(row.date);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

    const key = schedule?.id
      ? `${schedule.id}_${format(startDate, "yyyy-MM-dd")}`
      : row.id;

    if (!map.has(key)) {
      map.set(key, {
        start: format(startDate, "yyyy-MM-dd HH:mm"),
        end: format(endDate, "yyyy-MM-dd HH:mm"),
        title: schedule?.title ?? student?.name,
        class: schedule?.is_group ? "event-group" : "event-individual",
        status: row.status,
        students: [],
        attendance_id: row.id,
        link: row.link,
      });
    }

    if (student)
      map.get(key)!.students.push({ ...student, status: row.status });

    const dateKey = format(startDate, "yyyy-MM-dd");
    realKeys.add(`${row.student_id}_${dateKey}`);
  }

  for (const schedule of schedules) {
    const startDate = new Date(schedule.start_date);
    const dayOfWeek = startDate.getUTCDay();
    const timeH = startDate.getUTCHours();
    const timeM = startDate.getUTCMinutes();

    const students = Array.isArray(schedule.students)
      ? schedule.students
      : schedule.students
        ? [schedule.students]
        : [];

    const cursor = new Date(rangeStart);
    cursor.setUTCHours(timeH, timeM, 0, 0);
    while (cursor.getUTCDay() !== dayOfWeek) {
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    while (cursor < rangeEnd) {
      const dateKey = format(cursor, "yyyy-MM-dd");
      const key = `${schedule.id}_${dateKey}`;

      const alreadyReal = students.some((s: any) =>
        realKeys.has(`${s.user_id}_${dateKey}`),
      );

      if (!map.has(key) && !alreadyReal) {
        const endCursor = new Date(cursor.getTime() + 60 * 60 * 1000);
        map.set(key, {
          start: format(cursor, "yyyy-MM-dd HH:mm"),
          end: format(endCursor, "yyyy-MM-dd HH:mm"),
          title: schedule.title,
          class: schedule.is_group ? "event-group" : "event-individual",
          status: "scheduled",
          students: students.map((s: any) => ({ ...s, status: "scheduled" })),
          attendance_id: null,
        });
      }

      cursor.setUTCDate(cursor.getUTCDate() + 7);
    }
  }

  return Array.from(map.values());
}

const isToday = (date: Date | string): boolean => {
  const d = new Date(date);
  const today = new Date();
  return (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  );
};
</script>

<style scoped>
.vuecal {
  --vuecal-primary-color: #0080ff;
}
</style>
