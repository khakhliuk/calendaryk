<template>
  <div>
    <!-- Date and Stats -->
    <div class="bg-white px-4 py-4">
      <div class="flex space-x-2 mb-4">
        <button
          @click="activeTab = 'day'"
          class="flex-1 py-2 px-4 rounded-lg font-medium transition-colors"
          :class="
            activeTab === 'day'
              ? 'bg-gray-100 text-gray-900 shadow-sm'
              : 'bg-transparent text-gray-600'
          "
        >
          Сьогодні
        </button>
        <button
          @click="activeTab = 'calendar'"
          class="flex-1 py-2 px-4 rounded-lg font-medium transition-colors"
          :class="
            activeTab === 'calendar'
              ? 'bg-gray-100 text-gray-900 shadow-sm'
              : 'bg-transparent text-gray-600'
          "
        >
          Календар
        </button>
      </div>
      <div class="flex items-center text-gray-700 mb-4">
        <span class="mr-2">📅</span>
        <span class="text-sm">{{
          format(new Date(), "EEEE, d MMMM, yyyy", { locale: uk })
        }}</span>
      </div>

      <div class="flex space-x-4">
        <div class="flex-1 bg-blue-50 rounded-lg p-2">
          <div class="flex items-center">
            <span class="text-2xl mr-3">📖</span>
            <div>
              <p class="text-2xl font-semibold text-gray-900">
                {{ scheduleList.length }}
              </p>
              <p class="text-sm text-gray-600">Всього занять сьогодні</p>
            </div>
          </div>
        </div>

        <!-- <div class="flex-1 bg-green-50 rounded-lg p-2">
          <div class="flex items-center">
            <span class="text-2xl mr-3">🕐</span>
            <div>
              <p class="text-2xl font-semibold text-gray-900">3</p>
              <p class="text-sm text-gray-600">Попереду</p>
            </div>
          </div>
        </div> -->
      </div>
    </div>

    <!-- Schedule List -->
    <div class="px-4 py-4">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">
        Розклад на сьогодні
      </h2>

      <div class="space-y-3">
        <div
          v-if="scheduleList.length !== 0"
          v-for="item in scheduleList"
          :class="[
            getBadgeStatus(item.schedule.start_date) === BadgeStatus.Passed
              ? 'bg-gray-200 text-gray-500'
              : 'bg-white',
            getBadgeStatus(item.schedule.start_date) === BadgeStatus.Current
              ? 'bg-yellow-100 text-gray-500'
              : 'bg-white',
            'rounded-lg p-4',
            'bg-white rounded-lg p-4 shadow-sm',
            item.schedule.is_group
              ? 'border-l-4 border-green-300'
              : 'border-l-4 border-blue-300',
          ]"
        >
          <div class="flex items-start justify-between">
            <div class="flex flex-col">
              <div class="flex items-center text-sm text-gray-700 mb-1">
                <i class="pi pi-clock mr-1" style="color: #708090"></i>
                <span>{{ format(item.schedule.start_date, "HH:mm") }}</span>
              </div>
              <div class="flex items-center text-gray-700">
                <span v-if="item.schedule.is_group">
                  <i class="pi pi-users" style="color: #708090"></i>
                  {{ item.schedule.group?.title }}
                </span>
                <span v-else>
                  <i class="pi pi-user" style="color: #708090"></i>
                  {{ item.attendances[0]?.student?.name }}
                </span>
              </div>
            </div>
            <div
              :class="[
                'text-sm px-2 rounded-xl',
                badgeClass(item.schedule.start_date),
              ]"
            >
              <span>{{ getBadgeStatus(item.schedule.start_date) }}</span>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-10">
          <p class="text-gray-500">На сьогодні немає занять.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, type Ref } from "vue";
import { supabase } from "../lib/supabaseClient.js";
import { format } from "date-fns";
import { uk } from "date-fns/locale";
import type { ScheduleGroup } from "../models/getScheduleModel.js";

const activeTab = ref<"day" | "calendar">("day");
const scheduleList: Ref<ScheduleGroup[]> = ref([]);
const TIME_THRESHOLD = 20 * 60 * 1000; // 20 хвилин

enum BadgeStatus {
  Current = "Зараз",
  Soon = "Найближче",
  Planned = "Згодом",
  Passed = "Завершене",
}

const getBadgeStatus = (date: string | number | Date): BadgeStatus | "" => {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return "";

  const now = Date.now();
  d.setDate(new Date().getDate());
  d.setMonth(new Date().getMonth());
  const start = d.getTime();

  if (now >= start) {
    return now - start <= TIME_THRESHOLD
      ? BadgeStatus.Current
      : BadgeStatus.Passed;
  }

  return start - now <= TIME_THRESHOLD ? BadgeStatus.Soon : BadgeStatus.Planned;
};

const badgeClass = (date: string | number | Date): string => {
  const status = getBadgeStatus(date);
  if (status === BadgeStatus.Current) return "bg-yellow-200 text-yellow-800";
  if (status === BadgeStatus.Soon) return "bg-blue-300 text-blue-800";
  if (status === BadgeStatus.Planned) return "bg-blue-100 text-blue-800";
  if (status === BadgeStatus.Passed) return "bg-gray-400 text-gray-700";
  return "bg-gray-400 text-gray-700";
};

onMounted(async () => {
  //await getData();
});

const getData = async () => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const now = new Date();
    const startStr = format(now, "yyyy-MM-dd 00:00:00");
    const endStr = format(now, "yyyy-MM-dd 23:59:59");

    const { data, error } = await supabase
      .from("attendances")
      .select(
        `
        id,
        date,
        status,
        student_id,
        student:users!attendances_student_id_fkey(user_id, name),
        schedule:schedule!schedule_id(
          id,
          start_date,
          title,
          group_id,
          is_group,
          is_regular,
          group:groups!schedule_group_id_fkey(id, title)
        )
      `,
      )
      .gte("date", startStr)
      .lt("date", endStr)
      .eq("teacher_id", user!.id)
      .order("date", { ascending: true });

    if (error) throw error;
    if (!data) return;

    const grouped = data.reduce<Record<string, any>>((acc, row) => {
      const schedule = row.schedule as unknown as {
        id: string;
        start_date: string;
        title: string;
        is_group: boolean;
        is_regular: boolean;
        group_id: string;
        group: {
          id: string;
          title: string;
        } | null;
      };

      if (!schedule) return acc;

      if (!acc[schedule.id]) {
        acc[schedule.id] = {
          schedule: {
            ...schedule,
            group: schedule.group ?? null,
          },
          attendances: [],
        };
      }

      acc[schedule.id].attendances.push({
        id: row.id,
        date: row.date,
        status: row.status,
        student_id: row.student_id,
        is_group: schedule.is_group,
        is_regular: schedule.is_regular,
        student: row.student as unknown as {
          user_id: string;
          name: string;
        } | null,
      });

      return acc;
    }, {});

    scheduleList.value = Object.values(grouped);
  } catch (error) {
    console.error("Error loading schedule:", error);
  }
};
</script>

<style scoped></style>
