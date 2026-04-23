<template>
  <div class="px-4 py-2 bg-gray-100 h-full">
    <!-- Header -->
    <div class="mb-2">
      <h1 class="text-2xl font-bold text-gray-900">
        {{ isEditMode ? "Редагувати групу" : "Створити групу" }}
      </h1>
    </div>

    <!-- Form -->
    <div class="bg-white rounded-lg shadow-sm px-4 py-1 space-y-3">
      <!-- Назва групи -->
      <div>
        <label for="title" class="block text-sm font-medium text-gray-700 mb-2">
          Назва групи
        </label>
        <InputText
          v-model="form.title"
          type="text"
          placeholder="Наприклад: Juniors, Beginners A1"
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <!-- Учні -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Учні
          {{ form.students ? `(${form.students.length} вибрано)` : "" }}
        </label>

        <div class="card flex justify-center">
          <MultiSelect
            v-model="form.students"
            :options="allStudents"
            optionLabel="name"
            filter
            placeholder="Оберіть учнів"
            class="w-full multiselect-multiline"
            panelStyle="width: 300px"
          />
        </div>
      </div>
      <div v-if="isEditMode" class="space-y-1 mb-4">
        <label class="block text-sm font-medium text-gray-700"> Розклад </label>
        <div class="space-y-1 border border-gray-300 rounded-lg p-3">
          <div v-if="form.schedules.length > 0" class="space-y-2 mb-1">
            <div
              v-for="schedule in form.schedules"
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
            @click="openDialog()"
          />
        </div>
      </div>
      <Button
        label="Зберегти"
        severity="info"
        raised
        :loading="savingLoading"
        class="w-full"
        @click="saveGroup()"
      />
      <Button
        :label="isEditMode ? 'Видалити групу' : 'Скасувати'"
        severity="danger"
        variant="text"
        size="small"
        class="w-full"
        :loading="savingLoading"
        @click="deleteGroup()"
      />
    </div>
  </div>
  <Dialog
    v-model:visible="showDialog"
    modal
    header="Створити"
    :style="{ width: 'auto' }"
  >
    <div class="flex flex-col gap-2">
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
import type { TeacherStudentsGet } from "../models/teacherStudentsGet.js";
import type { GroupMember } from "../models/getGroupsModel.js";
import type { ShortScheduleModel } from "../models/getShortSchedule.js";
import { useToast } from "primevue/usetoast";
import { format } from "date-fns";
import { uk } from "date-fns/locale";
import { useBackButton } from "vue-tg";

interface GroupForm {
  title: string;
  students: TeacherStudentsGet[];
  schedules: ShortScheduleModel[];
}

const now = new Date();
now.setMinutes(0);

const showDialog = ref(false);
const dialogTitle = ref<string | undefined>(undefined);
const dialogLink = ref<string | null>(null);
const selectedDay = ref<number | null>(null);
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

const toast = useToast();
const route = useRoute();
const router = useRouter();
const backButton = useBackButton();
backButton?.show?.();

backButton?.onClick?.(() => {
  handleBack();
});

const isEditMode = computed(() => !!route.params.id);
const groupId = computed(() => route.params.id as string);

const allStudents = ref<TeacherStudentsGet[]>([]);

const form = ref<GroupForm>({
  title: "",
  students: [],
  schedules: [],
});

const savingLoading = ref(false);

onMounted(async () => {
  await loadStudents();
  if (isEditMode.value) {
    await loadGroup();
  }
});

const openDialog = async () => {
  showDialog.value = true;
  dialogTitle.value = form.value.title;
};

const confirmDialog = async () => {
  addSchedule();

  showDialog.value = false;
  selectedDay.value = null;
  selectedTime.value = null;
  savingLoading.value = false;
};

const loadStudents = async () => {
  try {
    savingLoading.value = true;

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
      allStudents.value = [];
      console.log("there no relations!");
      return;
    }

    const studentIds = relations.map((r) => r.student_id);

    const { data: studentsData, error: studError } = await supabase
      .from("users")
      .select("*")
      .in("user_id", studentIds);

    if (studError) {
      throw studError;
    }

    if (studentsData) {
      allStudents.value = studentsData;
    }
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

const deleteGroup = async () => {
  try {
    savingLoading.value = true;

    if (!isEditMode.value) {
      handleBack();
      return;
    }

    if (
      !confirm(
        "Ви впевнені, що хочете видалити цю групу? Цю дію не можна скасувати.",
      )
    ) {
      return;
    }

    const { error } = await supabase
      .from("groups")
      .delete()
      .eq("id", groupId.value);

    if (error) {
      throw error;
    }

    handleBack();
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
    console.log("Deleting schedule with ID:", scheduleId);
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
    await loadGroup();
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
          isGroup: true,
          date: nextDate,
          link: dialogLink.value,
          id: groupId.value,
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
    await loadGroup();
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

const saveGroup = async () => {
  try {
    savingLoading.value = true;

    var groupIdValue = groupId.value ? groupId.value : null;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (isEditMode.value) {
      const { error: updateGroupError } = await supabase
        .from("groups")
        .update({ title: form.value.title })
        .eq("id", groupIdValue);

      if (updateGroupError) throw updateGroupError;
    } else {
      const { data: newGroup, error: insertGroupError } = await supabase
        .from("groups")
        .insert({ title: form.value.title, teacher_id: user!.id })
        .select()
        .single();

      if (insertGroupError) {
        throw insertGroupError;
      }

      groupIdValue = newGroup.id;
    }

    //Group members
    if (isEditMode.value) {
      const { error: deleteMembersError } = await supabase
        .from("group_members")
        .delete()
        .eq("group_id", groupIdValue);

      if (deleteMembersError) throw deleteMembersError;
    }

    const { error: insertMembersError } = await supabase
      .from("group_members")
      .insert(
        form.value.students.map((student) => ({
          group_id: groupIdValue,
          student_id: student.user_id,
        })),
      );

    if (insertMembersError) {
      throw insertMembersError;
    }

    if (isEditMode) {
      await loadGroup();
    } else {
      toast.add({ severity: "success", summary: "Групу створено", life: 2000 });
      handleBack();
    }
  } catch (error) {
    console.error(error);
    toast.add({
      severity: "error",
      summary: "Помилка збереження",
      life: 3000,
    });
  } finally {
    savingLoading.value = false;
  }
};

async function loadGroup() {
  try {
    savingLoading.value = true;

    const { data, error } = await supabase
      .from("groups")
      .select(
        `
    *,
    group_members(*),
    schedule!group_id(id, start_date)
  `,
      )
      .eq("id", groupId.value)
      .single();

    if (error) throw error;
    console.log(data);

    form.value.title = data.title;
    form.value.schedules = data.schedule.map((item: any) => ({
      ...item,
      start_date: new Date(item.start_date),
    }));
    form.value.students = allStudents.value.filter((student) =>
      data.group_members.some(
        (gm: GroupMember) => gm.student_id === student.user_id,
      ),
    );
  } catch (error) {
    console.error(error);
    toast.add({
      severity: "error",
      summary: "Помилка завантаження",
      life: 3000,
    });
  } finally {
    savingLoading.value = false;
  }
}

function handleBack() {
  router.push({
    name: "Students",
    params: { activeTab: "groups" },
  });
}
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
