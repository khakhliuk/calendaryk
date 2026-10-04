<template>
  <div class="px-4 py-2 bg-gray-100 h-full">
    <div class="mb-2">
      <h1 class="font-bold text-gray-900 text-2xl">Картка учня</h1>
    </div>

    <div class="bg-white rounded-lg px-3 py-1 space-y-2">
      <div>
        <label class="block text-sm font-medium text-gray-600"> ПІБ </label>
        <div class="flex flex-row items-center justify-between">
          <h1 class="truncate font-medium">
            {{ student?.name }}
          </h1>
          <div class="flex items-center justify-between space-x-4 ml-2">
            <span
              class="text-xs px-2 py-1 rounded font-medium"
              :class="
                student?.is_active
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-700'
              "
            >
              {{ student?.is_active ? "Активний" : "Не активний" }}
            </span>
          </div>
        </div>
      </div>

      <PaidLessons
        :value="paidLessons"
        @save="savePaidLessons"
        @disable="savePaidLessons(null)"
      />

      <ScheduleList
        title="Розклад"
        :items="regularLessons"
        date-format="EEEE - HH:mm"
        add-label="Створити"
        :loading="loading"
        @add="openDialog(true)"
        @remove="removeSchedule"
      />

      <ScheduleList
        title="Разові заняття"
        :items="oneTimeLessons"
        date-format="dd.MM.yyyy, HH:mm"
        add-label="Запланувати"
        :loading="loading"
        @add="openDialog(false)"
        @remove="deleteAttendance"
      />

      <div class="text-xl space-y-2 pt-2">
        <Button
          :label="student?.is_active ? 'Деактивувати учня' : 'Відновити'"
          :severity="student?.is_active ? 'danger' : 'info'"
          size="small"
          variant="text"
          class="w-full"
          @click="toggleActiveStatus"
        />
      </div>
    </div>
  </div>

  <Dialog
    v-model:visible="showDialog"
    modal
    header="Створити"
    :style="{ width: 'auto' }"
  >
    <div class="flex flex-col gap-2">
      <div v-if="isRegularLesson">
        <div class="flex items-center gap-2">
          <Select
            v-model="selectedDay"
            :options="WEEK_DAYS"
            optionLabel="label"
            optionValue="value"
            placeholder="День тижня"
            class="flex-1"
          />
          <DatePicker
            v-model="selectedTime"
            timeOnly
            hourFormat="24"
            placeholder="14:00"
            class="w-20 shrink-0"
          />
        </div>
        <label class="text-xs text-gray-500">Назва</label>
        <InputText v-model="dialogTitle" class="w-full" />
      </div>

      <div v-else>
        <label class="text-xs text-gray-500">Дата і час</label>
        <DatePicker
          v-model="selectedDateTime"
          hourFormat="24"
          showTime
          placeholder="Дата та час"
          class="w-full"
        />
      </div>
      <label class="text-xs text-gray-500">Посилання (опціонально)</label>
      <InputText
        v-model="dialogLink"
        placeholder="лінк.юа/..."
        class="w-full"
      />
    </div>

    <Button
      icon="pi pi-plus"
      severity="info"
      label="Створити"
      :disabled="!canCreate"
      class="w-full mt-3"
      @click="confirmDialog"
    />
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useBackButton } from "vue-tg";
import { createSupabaseDbClient } from "../lib/supabaseClient";
import { getCurrentUserId } from "../lib/session";
import { useNotify } from "../composables/useNotify";
import { createSchedule, deleteSchedule } from "../services/schedule";
import { WEEK_DAYS, getCurrentHour, getNextOccurrence } from "../utils/date";
import ScheduleList from "../components/ScheduleList.vue";
import type { User } from "../models/user";
import type { Attendance } from "../models/attendance";
import type { ShortScheduleModel } from "../models/getShortSchedule";

const supabase = createSupabaseDbClient();
const router = useRouter();
const route = useRoute();
const notify = useNotify();

const backButton = useBackButton();
backButton?.show?.();
backButton?.onClick?.(goBack);

const studentId = computed(() => route.params.id as string | undefined);

const student = ref<User | null>(null);
const schedules = ref<ShortScheduleModel[]>([]);
const attendances = ref<Attendance[]>([]);
const paidLessons = ref<number | null>(null);
const loading = ref(false);

const regularLessons = computed(() =>
  schedules.value.map((s) => ({ id: s.id, date: s.start_date })),
);
const oneTimeLessons = computed(() =>
  attendances.value.map((a) => ({ id: a.id, date: a.date })),
);

// Діалог створення заняття
const showDialog = ref(false);
const isRegularLesson = ref(false);
const selectedDay = ref<number | null>(null);
const selectedTime = ref<Date | null>(getCurrentHour());
const selectedDateTime = ref<Date | null>(getCurrentHour());
const dialogTitle = ref("");
const dialogLink = ref<string | null>(null);

const canCreate = computed(() => {
  if (isRegularLesson.value) {
    return (
      selectedDay.value !== null &&
      selectedTime.value !== null &&
      !!dialogTitle.value.trim()
    );
  }
  return selectedDateTime.value !== null;
});

onMounted(async () => {
  if (!studentId.value) {
    goBack();
    return;
  }

  await loadData();
});

function goBack() {
  router.push({ name: "Students" });
}

const loadData = async () => {
  try {
    loading.value = true;
    const teacherId = getCurrentUserId();

    const [studentRes, attendancesRes, relationRes] = await Promise.all([
      supabase
        .from("users")
        .select("*, schedule!student_id(id, start_date)")
        .eq("user_id", studentId.value)
        .single(),
      supabase
        .from("attendances")
        .select("*")
        .eq("student_id", studentId.value)
        .eq("teacher_id", teacherId)
        .is("schedule_id", null)
        .eq("status", "scheduled")
        .order("date"),
      supabase
        .from("teachers_students")
        .select("paid_lessons")
        .eq("student_id", studentId.value)
        .eq("teacher_id", teacherId)
        .maybeSingle(),
    ]);

    if (studentRes.error) throw studentRes.error;
    if (attendancesRes.error) throw attendancesRes.error;
    if (relationRes.error) throw relationRes.error;

    student.value = studentRes.data;
    schedules.value = studentRes.data.schedule ?? [];
    attendances.value = attendancesRes.data ?? [];
    paidLessons.value = relationRes.data?.paid_lessons ?? null;
  } catch (error) {
    notify.error("Помилка завантаження", error);
  } finally {
    loading.value = false;
  }
};

const savePaidLessons = async (value: number | null) => {
  try {
    const { error } = await supabase
      .from("teachers_students")
      .update({ paid_lessons: value })
      .eq("student_id", studentId.value)
      .eq("teacher_id", getCurrentUserId());

    if (error) throw error;

    if (value !== null) notify.success("Успішно збережено");
  } catch (error) {
    notify.error("Помилка збереження", error);
  } finally {
    await loadData();
  }
};

const openDialog = (regular: boolean) => {
  isRegularLesson.value = regular;
  dialogTitle.value = student.value?.name ?? "";
  showDialog.value = true;
};

const resetDialog = () => {
  showDialog.value = false;
  selectedDay.value = null;
  selectedTime.value = getCurrentHour();
  selectedDateTime.value = getCurrentHour();
  dialogLink.value = null;
};

const confirmDialog = async () => {
  if (isRegularLesson.value) {
    await addSchedule();
  } else {
    await addAttendance();
  }
};

const addSchedule = async () => {
  if (selectedDay.value === null || !selectedTime.value || !studentId.value) {
    notify.warn("Оберіть день та час");
    return;
  }

  const payload = {
    title: dialogTitle.value,
    isGroup: false,
    date: getNextOccurrence(selectedDay.value, selectedTime.value),
    link: dialogLink.value,
    id: studentId.value,
  };
  resetDialog();

  try {
    loading.value = true;
    await createSchedule(payload);
  } catch (error) {
    notify.error("Помилка додавання розкладу", error);
  } finally {
    await loadData();
  }
};

const addAttendance = async () => {
  if (!selectedDateTime.value) {
    notify.warn("Оберіть день та час");
    return;
  }

  const lesson = {
    date: selectedDateTime.value,
    link: dialogLink.value,
    student_id: studentId.value,
    teacher_id: getCurrentUserId(),
  };
  resetDialog();

  try {
    loading.value = true;
    const { error } = await supabase.from("attendances").insert(lesson);
    if (error) throw error;
  } catch (error) {
    notify.error("Помилка додавання", error);
  } finally {
    await loadData();
  }
};

const removeSchedule = async (scheduleId: string) => {
  try {
    loading.value = true;
    await deleteSchedule(scheduleId);
  } catch (error) {
    notify.error("Помилка видалення", error);
  } finally {
    await loadData();
  }
};

const deleteAttendance = async (attendanceId: string) => {
  try {
    loading.value = true;
    const { error } = await supabase
      .from("attendances")
      .delete()
      .eq("id", attendanceId);

    if (error) throw error;
  } catch (error) {
    notify.error("Помилка видалення", error);
  } finally {
    await loadData();
  }
};

const toggleActiveStatus = async () => {
  if (!student.value) return;

  const { error } = await supabase
    .from("users")
    .update({ is_active: !student.value.is_active })
    .eq("user_id", student.value.user_id);

  if (error) {
    notify.error("Не вдалося змінити статус", error);
    return;
  }

  await loadData();
};
</script>
