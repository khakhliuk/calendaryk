<template>
  <div class="min-h-screen bg-gray-50">
    <div class="bg-white px-4 flex border-b border-gray-200">
      <RouterLink
        to="/dashboard"
        class="flex-1 py-3 text-center font-medium"
        active-class="text-gray-900 border-b-2 border-blue-600"
        inactive-class="text-gray-600"
      >
        Сьогодні
      </RouterLink>

      <RouterLink
        to="/calendar"
        class="flex-1 py-3 text-center font-medium"
        active-class="text-gray-900 border-b-2 border-blue-600"
        inactive-class="text-gray-600"
      >
        Календар
      </RouterLink>
    </div>
    <DatePicker
      v-model="selectedDate"
      inline
      class="w-full sm:w-full"
      @month-change="getData"
    >
      <template #date="slotProps">
        <div
          class="flex flex-col items-center justify-center"
          :class="{ 'text-blue-700 font-bold': hasClasses(slotProps.date) }"
        >
          <span>{{ slotProps.date.day }}</span>
        </div>
      </template>
    </DatePicker>
    <!-- Selected Day Classes -->
    <div v-if="selectedDate !== null" class="bg-white rounded-lg shadow-sm p-4">
      <h3 class="font-semibold text-gray-900 mb-3">
        {{ format(selectedDate, "EEEE, d MMMM, yyyy", { locale: uk }) }}
      </h3>
      <div v-if="selectedDate" class="space-y-2">
        <div
          v-if="getClassesForDate(selectedDate).length > 0"
          class="space-y-3"
        >
          <div
            v-for="schedule in getClassesForDate(selectedDate)"
            :class="[
              'bg-white rounded-lg p-4 shadow-sm',
              schedule.is_group
                ? 'border-l-4 border-green-500'
                : 'border-l-4 border-blue-500',
            ]"
          >
            <div class="flex items-start justify-between mb-2">
              <h3 class="font-semibold text-gray-900">
                {{ schedule.title }}
              </h3>
            </div>
            <div class="flex items-center text-sm text-gray-600 mb-3">
              <span class="mr-1">🕐</span>
              <span>{{ format(schedule.date, "HH:mm") }}</span>
              <!-- <span class="mx-2">•</span>
                <span>45 min</span> -->
            </div>
            <div class="flex items-center text-sm text-gray-600">
              <span v-if="schedule.is_group" class="mr-3"
                >👥 {{ schedule.visitor }}</span
              >
              <span v-else class="mr-3">👤 {{ schedule.visitor }}</span>
              <!-- <span>📍 Room 201</span> -->
            </div>
          </div>
        </div>
        <p v-else class="text-gray-500 text-center py-4">
          Немає занять на цей день
        </p>
      </div>
    </div>
    <p v-else class="text-gray-500 text-center p-4">
      Оберіть дату, щоб побачити заняття на цей день
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onBeforeMount, type Ref } from "vue";
import type { Schedule } from "../models/schedule";
import { supabase } from "../lib/supabaseClient.js";
import { format } from "date-fns";
import { uk } from "date-fns/locale";
import type { DatePickerDateSlotOptions } from "primevue/datepicker";
import type { ScheduleWithDetails } from "../models/getScheduleWithDetails.js";

const calendarEvents: Ref<CalendarEvent[]> = ref([]);
const selectedDayEvents: Ref<CalendarEvent[]> = ref([]);

interface CalendarEvent {
  scheduleId: string;
  title: string;
  date: Date;
  isRegularOccurrence: boolean;
  teacher_id: string;
  visitor: string;
  is_group: boolean;
}

const currentDate = ref(new Date());
const selectedDate = ref<Date | null>(null);

const scheduleList = ref<ScheduleWithDetails[]>([]);
console.log(selectedDate.value);
const currentYear = computed(() => currentDate.value.getFullYear());
const currentMonth = computed(() => currentDate.value.getMonth());

const isToday = (date: Date | null) => {
  if (!date) return false;
  const today = new Date();

  return isSameDay(date, today);
};

const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

const hasClasses = (date: DatePickerDateSlotOptions) => {
  if (!date) return false;

  const checkDate = new Date(date.year, date.month, date.day);

  return calendarEvents.value.some((event) => {
    return isSameDay(new Date(event.date), checkDate);
  });
};

const getClassesForDate = (date: Date | null) => {
  if (!date) return [];

  return calendarEvents.value.filter((event) => {
    return isSameDay(new Date(event.date), date);
  });
};

// Функція для програмного додавання занять
const addClass = (classData: Schedule) => {
  // scheduleList.value.push(classData);
};

// Функція для видалення заняття
const removeClass = (id: number) => {
  // scheduleList.value = scheduleList.value.filter((c) => c.id !== id);
};

onBeforeMount(() => {
  getData();
});

const getData = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("schedule")
    .select(
      `
    *,
    group:groups!group_id(title),
    student:users!student_id(name)
  `,
    )
    .eq("teacher_id", user!.id)
    .order("start_date");

  if (data) {
    scheduleList.value = data;
  }

  const year = currentYear.value;
  const month = currentMonth.value;

  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0);
  console.log("Generated Calendar Events:", scheduleList.value);
  calendarEvents.value = generateCalendarEvents(
    scheduleList.value,
    startDate,
    endDate,
  );
};

function generateCalendarEvents(
  schedules: ScheduleWithDetails[],
  startDate: Date,
  endDate: Date,
): CalendarEvent[] {
  const events: CalendarEvent[] = [];

  for (const schedule of schedules) {
    if (!schedule.is_regular) {
      const scheduleDate = new Date(schedule.start_date);
      // Просте заняття
      if (scheduleDate >= startDate && scheduleDate <= endDate) {
        events.push({
          scheduleId: schedule.id,
          title: schedule.title,
          date: scheduleDate,
          isRegularOccurrence: false,
          teacher_id: schedule.teacher_id,
          visitor: schedule.student_id
            ? schedule.student!.name
            : schedule.group!.title,
          is_group: schedule.is_group,
        });
      }
    } else {
      // Регулярне заняття
      const originalDate = new Date(schedule.start_date);
      const dayOfWeek = originalDate.getDay();
      const timeHours = originalDate.getHours();
      const timeMinutes = originalDate.getMinutes();

      let currentDate = new Date(startDate);

      while (currentDate.getDay() !== dayOfWeek) {
        currentDate.setDate(currentDate.getDate() + 1);
      }

      while (currentDate <= endDate) {
        const eventDate = new Date(currentDate);
        eventDate.setHours(timeHours, timeMinutes, 0, 0);

        events.push({
          scheduleId: schedule.id,
          title: schedule.title,
          date: eventDate,
          isRegularOccurrence: true,
          teacher_id: schedule.teacher_id,
          visitor: schedule.student_id
            ? schedule.student!.name
            : schedule.group!.title,
          is_group: schedule.is_group,
        });

        currentDate.setDate(currentDate.getDate() + 7);
      }
    }
  }

  return events.sort((a, b) => a.date.getTime() - b.date.getTime());
}
</script>

<style scoped></style>
