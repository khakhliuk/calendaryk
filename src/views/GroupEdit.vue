<template>
  <div class="px-4 py-2 bg-gray-100 h-full">
    <div class="mb-2">
      <h1 class="text-2xl font-bold text-gray-900">
        {{ isEditMode ? "Редагувати групу" : "Створити групу" }}
      </h1>
    </div>

    <div class="bg-white rounded-lg shadow-sm px-4 py-1 space-y-3">
      <div>
        <label for="title" class="block text-sm font-medium text-gray-700 mb-2">
          Назва групи
        </label>
        <InputText
          id="title"
          v-model="form.title"
          type="text"
          placeholder="Наприклад: Juniors, Beginners A1"
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Учні ({{ form.students.length }} вибрано)
        </label>

        <div class="flex justify-center">
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

      <ScheduleList
        v-if="isEditMode"
        title="Розклад"
        :items="scheduleItems"
        date-format="EEEE - HH:mm"
        add-label="Створити"
        :loading="loading"
        @add="openDialog"
        @remove="removeSchedule"
      />

      <Button
        label="Зберегти"
        severity="info"
        raised
        :loading="loading"
        class="w-full"
        @click="saveGroup"
      />
      <Button
        :label="isEditMode ? 'Видалити групу' : 'Скасувати'"
        severity="danger"
        variant="text"
        size="small"
        class="w-full"
        :loading="loading"
        @click="isEditMode ? deleteGroup() : goBack()"
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
      @click="addSchedule"
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
import { fetchTeacherStudents } from "../services/students";
import { createSchedule, deleteSchedule } from "../services/schedule";
import { WEEK_DAYS, getCurrentHour, getNextOccurrence } from "../utils/date";
import ScheduleList from "../components/ScheduleList.vue";
import type { User } from "../models/user";
import type { GroupMember } from "../models/getGroupsModel";
import type { ShortScheduleModel } from "../models/getShortSchedule";

interface GroupForm {
  title: string;
  students: User[];
  schedules: ShortScheduleModel[];
}

const supabase = createSupabaseDbClient();
const route = useRoute();
const router = useRouter();
const notify = useNotify();

const backButton = useBackButton();
backButton?.show?.();
backButton?.onClick?.(goBack);

const groupId = computed(() => route.params.id as string | undefined);
const isEditMode = computed(() => !!groupId.value);

const allStudents = ref<User[]>([]);
const form = ref<GroupForm>({
  title: "",
  students: [],
  schedules: [],
});
const loading = ref(false);

const scheduleItems = computed(() =>
  form.value.schedules.map((s) => ({ id: s.id, date: s.start_date })),
);

// Діалог створення регулярного заняття
const showDialog = ref(false);
const selectedDay = ref<number | null>(null);
const selectedTime = ref<Date | null>(getCurrentHour());
const dialogTitle = ref("");
const dialogLink = ref<string | null>(null);

const canCreate = computed(
  () =>
    selectedDay.value !== null &&
    selectedTime.value !== null &&
    !!dialogTitle.value.trim(),
);

onMounted(async () => {
  await loadStudents();
  if (isEditMode.value) {
    await loadGroup();
  }
});

function goBack() {
  router.push({ name: "Students", query: { tab: "groups" } });
}

const loadStudents = async () => {
  try {
    loading.value = true;
    allStudents.value = await fetchTeacherStudents(getCurrentUserId());
  } catch (error) {
    notify.error("Помилка завантаження", error);
  } finally {
    loading.value = false;
  }
};

const loadGroup = async () => {
  try {
    loading.value = true;

    const { data, error } = await supabase
      .from("groups")
      .select("*, group_members(*), schedule!group_id(id, start_date)")
      .eq("id", groupId.value)
      .single();

    if (error) throw error;

    const memberIds = new Set(
      data.group_members.map((gm: GroupMember) => gm.student_id),
    );

    form.value.title = data.title;
    form.value.schedules = data.schedule;
    form.value.students = allStudents.value.filter((s) =>
      memberIds.has(s.user_id),
    );
  } catch (error) {
    notify.error("Помилка завантаження", error);
  } finally {
    loading.value = false;
  }
};

const saveGroup = async () => {
  const title = form.value.title.trim();
  if (!title) {
    notify.warn("Введіть назву групи");
    return;
  }

  try {
    loading.value = true;
    let id = groupId.value;

    if (id) {
      const { error } = await supabase
        .from("groups")
        .update({ title })
        .eq("id", id);
      if (error) throw error;

      // Простіше перезаписати список учасників, ніж шукати різницю
      const { error: deleteError } = await supabase
        .from("group_members")
        .delete()
        .eq("group_id", id);
      if (deleteError) throw deleteError;
    } else {
      const { data, error } = await supabase
        .from("groups")
        .insert({ title, teacher_id: getCurrentUserId() })
        .select()
        .single();
      if (error) throw error;

      id = data.id as string;
    }

    if (form.value.students.length) {
      const { error } = await supabase.from("group_members").insert(
        form.value.students.map((student) => ({
          group_id: id,
          student_id: student.user_id,
        })),
      );
      if (error) throw error;
    }

    if (isEditMode.value) {
      notify.success("Збережено");
      await loadGroup();
    } else {
      notify.success("Групу створено");
      goBack();
    }
  } catch (error) {
    notify.error("Помилка збереження", error);
  } finally {
    loading.value = false;
  }
};

const deleteGroup = async () => {
  if (
    !confirm(
      "Ви впевнені, що хочете видалити цю групу? Цю дію не можна скасувати.",
    )
  ) {
    return;
  }

  try {
    loading.value = true;
    const { error } = await supabase
      .from("groups")
      .delete()
      .eq("id", groupId.value);

    if (error) throw error;

    goBack();
  } catch (error) {
    notify.error("Помилка видалення", error);
  } finally {
    loading.value = false;
  }
};

const openDialog = () => {
  dialogTitle.value = form.value.title;
  showDialog.value = true;
};

const addSchedule = async () => {
  if (selectedDay.value === null || !selectedTime.value || !groupId.value) {
    notify.warn("Оберіть день та час");
    return;
  }

  const payload = {
    title: dialogTitle.value,
    isGroup: true,
    date: getNextOccurrence(selectedDay.value, selectedTime.value),
    link: dialogLink.value,
    id: groupId.value,
  };

  showDialog.value = false;
  selectedDay.value = null;
  selectedTime.value = getCurrentHour();
  dialogLink.value = null;

  try {
    loading.value = true;
    await createSchedule(payload);
  } catch (error) {
    notify.error("Помилка додавання розкладу", error);
  } finally {
    await loadGroup();
  }
};

const removeSchedule = async (scheduleId: string) => {
  try {
    loading.value = true;
    await deleteSchedule(scheduleId);
  } catch (error) {
    notify.error("Помилка видалення", error);
  } finally {
    await loadGroup();
  }
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
