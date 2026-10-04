<template>
  <div>
    <div class="bg-white px-4 py-1 border-b border-gray-200">
      <div class="flex space-x-2">
        <button
          v-for="tab in viewTabs"
          :key="tab.view"
          class="flex-1 py-2 px-4 rounded-lg font-medium transition-colors shadow-sm"
          :class="
            activeTab === tab.view
              ? 'bg-gray-200 text-gray-900'
              : 'bg-transparent text-gray-600'
          "
          @click="calRef?.switchView(tab.view)"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>

    <div class="h-[calc(100vh-168px)] overflow-hidden">
      <vue-cal
        ref="calRef"
        locale="uk"
        hide-view-selector
        :events="events"
        :time-from="0"
        :time-to="24 * 60"
        :disable-views="['years', 'year', 'week']"
        style="height: 100%"
        @view-change="onViewChange"
        @event-click="onEventClick"
      >
        <template #event="{ event }">
          <div
            class="h-full px-2 py-1 flex items-center border-l-4"
            :class="getEventBgClass(event)"
          >
            <div
              class="text-sm font-medium px-1"
              :class="getEventTextClass(event)"
            >
              {{ event.title }}
              <span class="text-sm">
                ({{ format(event.start, "HH:mm", { locale: uk }) }})
              </span>
            </div>
          </div>
        </template>
        <template #cell-content="{ cell, view, events: cellEvents }">
          <div class="vuecal__cell-date">{{ cell.content }}</div>
          <div
            v-if="view.id === 'month' && cellEvents.length"
            class="flex flex-wrap justify-center mt-1 gap-0.5"
          >
            <span
              v-for="(event, index) in cellEvents"
              :key="index"
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
          <span class="text-sm text-gray-500 mt-1">Залишилось</span>
        </div>
      </div>

      <div
        v-if="canceledEventsCount > 0"
        class="flex-1 bg-red-100 items-center rounded-xl px-2 py-2"
      >
        <div class="flex justify-center items-center gap-2">
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

  <EventDetailsModal
    v-model:visible="showModal"
    :event="selectedEvent"
    @close="loadEvents"
  />
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useBackButton } from "vue-tg";
import VueCal from "vue-cal";
import "vue-cal/dist/vuecal.css";
import { format, isToday } from "date-fns";
import { uk } from "date-fns/locale";
import { createSupabaseDbClient } from "../lib/supabaseClient";
import { getCurrentUserId, isTeacher } from "../lib/session";
import { useNotify } from "../composables/useNotify";
import {
  buildCalEvents,
  type AttendanceRow,
  type ScheduleRow,
} from "../utils/calendarEvents";
import EventDetailsModal from "../components/EventDetailsModal.vue";
import type { CalEvent } from "../models/calendarEvent";

type CalendarView = "day" | "month";

interface ViewChangeEvent {
  view: CalendarView;
  startDate: Date;
  endDate: Date;
}

const supabase = createSupabaseDbClient();
const notify = useNotify();

const backButton = useBackButton();
backButton?.hide?.();

const viewTabs: { view: CalendarView; label: string }[] = [
  { view: "day", label: "День" },
  { view: "month", label: "Місяць" },
];

const calRef = ref();
const activeTab = ref<CalendarView>("day");
const events = ref<CalEvent[]>([]);
const selectedDate = ref(new Date());
const currentRange = ref<{ start: Date; end: Date } | null>(null);

const selectedEvent = ref<CalEvent | null>(null);
const showModal = ref(false);

const upcomingEventsCount = computed(
  () =>
    events.value.filter(
      (e) => e.status !== "canceled" && e.status !== "happened",
    ).length,
);

const canceledEventsCount = computed(
  () => events.value.filter((e) => e.status === "canceled").length,
);

onMounted(() => {
  goToToday();
  scrollToCurrentTime();
});

const getEventBgClass = (event: CalEvent) => {
  if (event.status === "happened") return "border-gray-300 bg-gray-100";
  if (event.status === "canceled") return "border-red-300 bg-red-50";
  if (event.class === "event-group") return "border-green-300 bg-green-50";
  return "border-blue-300 bg-blue-50";
};

const getEventTextClass = (event: CalEvent) => {
  if (event.status === "happened") return "text-gray-400 opacity-60";
  if (event.status === "canceled") return "text-red-400 line-through opacity-60";
  return "text-gray-800";
};

// Прокручуємо денний вигляд так, щоб поточна година була на екрані
const scrollToCurrentTime = () => {
  setTimeout(() => {
    const container = calRef.value?.$el?.querySelector(".vuecal__bg");
    if (!container) return;

    const now = new Date();
    const dayProgress = (now.getHours() * 60 + now.getMinutes()) / (24 * 60);
    const scrollTop = container.scrollHeight * dayProgress - 150;

    container.scrollTo({ top: scrollTop, behavior: "smooth" });
  }, 300);
};

const goToToday = () => {
  calRef.value?.switchView("day", new Date());
  selectedDate.value = new Date();
};

const onViewChange = async (e: ViewChangeEvent) => {
  activeTab.value = e.view;

  if (e.startDate) selectedDate.value = e.startDate;
  if (!e.startDate || !e.endDate) return;

  currentRange.value = { start: e.startDate, end: e.endDate };
  await loadEvents();

  if (e.view === "day") scrollToCurrentTime();
};

const onEventClick = (event: CalEvent) => {
  selectedEvent.value = event;
  showModal.value = true;
};

const loadEvents = async () => {
  if (!currentRange.value) return;

  // Межі діапазону беремо в UTC, як вони зберігаються в БД
  const startStr = format(currentRange.value.start, "yyyy-MM-dd") + "T00:00:00+00:00";
  const endStr = format(currentRange.value.end, "yyyy-MM-dd") + "T23:59:59+00:00";

  try {
    const userId = getCurrentUserId();
    const ownerColumn = isTeacher.value ? "teacher_id" : "student_id";

    const [attendancesRes, schedulesRes] = await Promise.all([
      supabase
        .from("attendances")
        .select(
          `
          id, date, status, link, note,
          student:users!attendances_student_id_fkey(user_id, name),
          schedule:schedule!schedule_id(id, title, is_group)
        `,
        )
        .gte("date", startStr)
        .lt("date", endStr)
        .eq(ownerColumn, userId),
      supabase
        .from("schedule")
        .select(
          `
          id, title, start_date, is_group,
          students:users!schedule_student_id_fkey(user_id, name)
        `,
        )
        .eq(ownerColumn, userId),
    ]);

    if (attendancesRes.error) throw attendancesRes.error;
    if (schedulesRes.error) throw schedulesRes.error;

    events.value = buildCalEvents(
      (attendancesRes.data ?? []) as unknown as AttendanceRow[],
      (schedulesRes.data ?? []) as unknown as ScheduleRow[],
      new Date(startStr),
      new Date(endStr),
    );
  } catch (error) {
    notify.error("Не вдалося завантажити розклад", error);
  }
};
</script>

<style scoped>
.vuecal {
  --vuecal-primary-color: #0080ff;
}
</style>
