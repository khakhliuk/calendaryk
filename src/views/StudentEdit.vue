<template>
  <div class="px-4 py-2 bg-gray-100 h-full">
    <!-- Header -->
    <div class="mb-2">
      <h1 class="font-bold text-gray-900 text-2xl">Картка учня</h1>
    </div>

    <!-- Form -->
    <div class="bg-white rounded-lg px-3 py-1 space-y-2">
      <div>
        <label class="block text-sm font-medium text-gray-600"> ПІБ </label>
        <div class="flex flex-row items-center justify-between">
          <h1 class="truncate font-medium">
            {{ form.student?.name }}
          </h1>
          <div class="flex items-center justify-between space-x-4 ml-2">
            <span
              class="text-xs px-2 py-1 rounded font-medium"
              :class="
                form.student?.is_active
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-700'
              "
            >
              {{ form.student?.is_active ? "Активний" : "Не активний" }}
            </span>
          </div>
        </div>
      </div>
      <div class="space-y-1 mb-4">
        <label class="block text-sm font-medium text-gray-700"> Розклад </label>
        <div class="space-y-1 border border-gray-300 rounded-lg p-3">
          <div v-if="form.regularSchedules.length > 0" class="space-y-2 mb-1">
            <div
              v-for="schedule in form.regularSchedules"
              :key="schedule.id"
              class="flex items-center justify-between rounded-lg bg-gray-200 border border-gray-300"
            >
              <span class="pl-2">
                {{
                  format(new Date(schedule.start_date), "EEEE - HH:mm", {
                    locale: uk,
                  })
                }}
              </span>
              <Button
                @click="deleteSchedule(schedule.id)"
                icon="pi pi-delete-left"
                class="text-red-600 ml-2 w-10"
                severity="danger"
                raised
              ></Button>
            </div>
          </div>
          <div v-else class="text-center py-1">
            <p class="text-gray-500">Список пустий.</p>
          </div>
          <Button
            label="Створити"
            severity="info"
            variant="text"
            :loading="savingLoading"
            class="w-full"
            @click="openDialog(true)"
          />
        </div>
      </div>

      <div class="space-y-1 mb-4">
        <label class="block text-sm font-medium text-gray-700">
          Разові заняття
        </label>
        <div class="space-y-1 mb-4 border border-gray-300 rounded-lg p-3">
          <div v-if="form.attendances.length > 0" class="space-y-2 mb-1">
            <div
              v-for="attendance in form.attendances"
              :key="attendance.id"
              class="flex items-center justify-between rounded-lg bg-gray-200 border border-gray-300"
            >
              <span class="pl-2">
                {{
                  format(new Date(attendance.date), "dd.MM.yyyy, HH:mm", {
                    locale: uk,
                  })
                }}
              </span>
              <Button
                @click="deleteAttendance(attendance.id)"
                class="text-red-600 ml-2"
                severity="danger"
                icon="pi pi-delete-left"
                raised
              >
              </Button>
            </div>
          </div>
          <div v-else class="text-center py-1">
            <p class="text-gray-500">Список пустий.</p>
          </div>

          <Button
            label="Запланувати"
            severity="info"
            variant="text"
            :loading="savingLoading"
            class="w-full"
            @click="openDialog(false)"
          />
        </div>
      </div>

      <div class="text-xl space-y-2 pt-5">
        <!-- <Button
          label="Зберегти"
          severity="info"
          raised
          :loading="savingLoading"
          class="w-full"
          @click="saveSchedule()"
        /> -->
        <Button
          :label="form.student?.is_active ? 'Деактивувати учня' : 'Відновити'"
          :severity="form.student?.is_active ? 'danger' : 'info'"
          size="small"
          variant="text"
          class="w-full"
          @click="changeActiveStatus()"
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
      <div v-if="isDialogSchedule">
        <div class="flex items-center gap-2">
          <Select
            v-model="selectedDay"
            :options="weekDays"
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
        <InputText
          v-model="dialogTitle"
          placeholder="лінк.юа/..."
          class="w-full"
        />
      </div>

      <div v-else>
        <DatePicker
          v-model="selectedOneTime"
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
      @click="confirmDialog"
      class="w-full mt-3"
    />
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { supabase } from "../lib/supabaseClient.js";
import type { ShortScheduleModel } from "../models/getShortSchedule.js";
import { format } from "date-fns";
import { uk } from "date-fns/locale";
import type { User } from "../models/user.js";
import type { Attendance } from "../models/attendance.js";
import { useToast } from "primevue/usetoast";
import { useBackButton } from "vue-tg";

interface StudentForm {
  student: User | null;
  regularSchedules: ShortScheduleModel[];
  attendances: Attendance[];
}

const router = useRouter();
const route = useRoute();
const backButton = useBackButton();
const toast = useToast();
backButton?.show?.();

backButton?.onClick?.(() => {
  handleBack();
});

const now = new Date();
now.setMinutes(0);
now.setSeconds(0);

const showDialog = ref(false);
const isDialogSchedule = ref(false);
const selectedDay = ref<number | null>(null);
const dialogTitle = ref<string | undefined>(undefined);
const dialogLink = ref<string | null>(null);
const selectedTime = ref<Date | null>(now);
const weekDays = [
  { label: "Понеділок", value: 1 },
  { label: "Вівторок", value: 2 },
  { label: "Середа", value: 3 },
  { label: "Четвер", value: 4 },
  { label: "П'ятниця", value: 5 },
  { label: "Субота", value: 6 },
  { label: "Неділя", value: 0 },
];
const selectedOneTime = ref<Date | null>(now);

const studentId = computed(() => route.params.id as string);
const form = ref<StudentForm>({
  student: null,
  regularSchedules: [],
  attendances: [],
});
const savingLoading = ref(false);

onMounted(async () => {
  if (studentId.value === undefined) {
    handleBack();
    return;
  }

  await prepareData();
});

const openDialog = async (isSchedule: boolean) => {
  showDialog.value = true;
  dialogTitle.value = form.value.student?.name;
  isDialogSchedule.value = isSchedule;
};

const confirmDialog = async () => {
  if (isDialogSchedule.value) {
    addSchedule();
  } else {
    addAttendance();
  }

  showDialog.value = false;
  selectedDay.value = null;
  selectedTime.value = null;
  selectedOneTime.value = null;
  savingLoading.value = false;
};

const prepareData = async () => {
  try {
    savingLoading.value = true;
    const { data: student, error: studentError } = await supabase
      .from("users")
      .select(
        `
      *,
        schedule!student_id(id, start_date,
          group:groups!schedule_group_id_fkey(*))
      `,
      )
      .eq("user_id", studentId.value)
      .single();

    if (studentError) {
      throw studentError;
    }

    const { data: attendances } = await supabase
      .from("attendances")
      .select("*")
      .eq("student_id", studentId.value)
      .is("schedule_id", null)
      .eq("status", "scheduled");

    form.value.student = student;
    form.value.regularSchedules = student.schedule;
    form.value.attendances = attendances ?? [];
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Помилка завантаження",
      life: 3000,
    });
  } finally {
    savingLoading.value = false;
  }
};

const deleteSchedule = async (scheduleId: string) => {
  try {
    savingLoading.value = true;

    const { error: attendanceError } = await supabase
      .from("attendances")
      .delete()
      .eq("schedule_id", scheduleId)
      .eq("status", "scheduled");

    if (attendanceError) {
      throw attendanceError;
    }

    const { error } = await supabase
      .from("schedule")
      .delete()
      .eq("id", scheduleId);

    if (error) {
      throw error;
    }
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Помилка видалення",
      life: 3000,
    });
  } finally {
    savingLoading.value = false;
    await prepareData();
  }
};

const addSchedule = async () => {
  if (selectedDay.value === null || !selectedTime.value) {
    alert("Оберіть день та час");
    return;
  }

  try {
    savingLoading.value = true;

    const nextDate = getNextOccurrence(
      selectedDay.value as number,
      selectedTime.value as Date,
    );

    const { error: updateScheduleError } = await supabase.functions.invoke(
      "create_schedule",
      {
        body: JSON.stringify({
          title: dialogTitle.value,
          isGroup: false,
          date: nextDate,
          link: dialogLink.value,
          id: studentId.value,
        }),
      },
    );

    if (updateScheduleError) {
      throw updateScheduleError;
    }
  } catch (error) {
    console.error(error);
    toast.add({
      severity: "error",
      summary: "Помилка додавання розкладу",
      life: 3000,
    });
  } finally {
    savingLoading.value = false;
    await prepareData();
  }
};

const deleteAttendance = async (attendanceId: string) => {
  try {
    savingLoading.value = true;
    const { error } = await supabase
      .from("attendances")
      .delete()
      .eq("id", attendanceId);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error(error);
    toast.add({
      severity: "error",
      summary: "Помилка видалення",
      life: 3000,
    });
  } finally {
    savingLoading.value = false;
    await prepareData();
  }
};

const addAttendance = async () => {
  try {
    if (!selectedOneTime.value) {
      alert("Оберіть день та час");
      return;
    }

    savingLoading.value = true;
    const dateToInsert = selectedOneTime.value;

    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from("attendances").insert({
      date: dateToInsert,
      link: dialogLink.value,
      student_id: form.value.student?.user_id,
      teacher_id: currentUser?.id,
    });

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error(error);
    toast.add({
      severity: "error",
      summary: "Помилка додавання",
      life: 3000,
    });
  } finally {
    savingLoading.value = false;
    await prepareData();
  }
};

function getNextOccurrence(dayOfWeek: number, time: Date): Date {
  const now = new Date();
  const result = new Date(now);
  result.setHours(time.getHours(), time.getMinutes(), 0, 0);
  const currentDay = now.getDay();
  const daysUntil = (dayOfWeek - currentDay + 7) % 7 || 7;
  result.setDate(now.getDate() + daysUntil);

  return result;
}

function handleBack() {
  router.push({
    name: "Students",
    params: { activeTab: "all" },
  });
}

const changeActiveStatus = async () => {
  if (!form.value.student) return;

  const newStatus = !form.value.student.is_active;
  const { error } = await supabase
    .from("users")
    .update({ is_active: newStatus })
    .eq("user_id", form.value.student.user_id);

  if (error) {
    console.error(error);
    return;
  }

  await prepareData();
};
</script>

<style scoped>
.multiselect-multiline :deep(.p-multiselect-label-container) {
  overflow: visible;
}

.multiselect-multiline :deep(.p-multiselect-label) {
  white-space: normal;
  overflow: visible;
  text-overflow: clip;
  min-height: 2.5rem;
  display: flex;
  align-items: center;
}

.multiselect-multiline :deep(.p-multiselect-token) {
  white-space: normal;
}
</style>
