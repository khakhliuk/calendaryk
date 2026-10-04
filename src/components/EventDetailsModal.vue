<template>
  <Dialog
    v-model:visible="isVisible"
    modal
    :header="event?.title ?? 'Заняття'"
    :style="{ width: '90vw', maxWidth: '400px' }"
  >
    <div v-if="event" class="flex flex-col gap-1">
      <div class="flex items-center gap-2 text-sm text-gray-600">
        <i class="pi pi-clock" />
        <span>{{ format(new Date(event.start), "HH:mm, dd.MM.yyyy") }}</span>
      </div>

      <NoteField v-if="event.attendance_id" :note="note" @save="saveNote" />

      <div v-if="event.attendance_id && isTeacher">
        <span class="text-sm text-gray-500">Статус</span>
        <Select
          v-model="status"
          :options="availableStatusOptions"
          optionLabel="label"
          optionValue="value"
          class="w-full"
          @change="onStatusChange"
        >
          <template #option="{ option }">
            <span :class="STATUS_TEXT_CLASS[option.value as LessonStatus]">
              {{ option.label }}
            </span>
          </template>
          <template #value="{ value }">
            <span :class="STATUS_TEXT_CLASS[value as LessonStatus]">
              {{ getStatusLabel(value) }}
            </span>
          </template>
        </Select>
      </div>
      <div v-else class="flex items-center gap-2 mt-1">
        <i class="pi pi-info-circle" />
        <Tag
          :value="getStatusLabel(status)"
          :severity="STATUS_SEVERITY[status]"
        />
      </div>

      <Button
        v-if="event.link && status !== 'canceled'"
        class="mt-2"
        as="a"
        label="Приєднатись"
        severity="info"
        size="small"
        :href="event.link"
        target="_blank"
        rel="noopener"
      />
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { format } from "date-fns";
import { usePopup } from "vue-tg";
import { createSupabaseDbClient } from "../lib/supabaseClient";
import { getCurrentUserId, isTeacher } from "../lib/session";
import { useNotify } from "../composables/useNotify";
import { incrementPaidLessons } from "../services/students";
import {
  LESSON_STATUS_OPTIONS,
  getStatusLabel,
  type LessonStatus,
} from "../constants/lessonStatus";
import NoteField from "./NoteField.vue";
import type { CalEvent } from "../models/calendarEvent";

const STATUS_TEXT_CLASS: Record<LessonStatus, string> = {
  scheduled: "text-blue-600",
  happened: "text-gray-600",
  canceled: "text-red-500",
};

const STATUS_SEVERITY: Record<LessonStatus, string> = {
  scheduled: "info",
  happened: "secondary",
  canceled: "danger",
};

const props = defineProps<{
  event: CalEvent | null;
}>();

const emit = defineEmits<{ close: [] }>();

const isVisible = defineModel<boolean>("visible");

const supabase = createSupabaseDbClient();
const popup = usePopup();
const notify = useNotify();

// Локальні копії, щоб не мутувати пропси. Після закриття
// модалки батьківський компонент сам перезавантажить події.
const status = ref<LessonStatus>("scheduled");
const note = ref<string | null>(null);

watch(
  () => props.event,
  (event) => {
    status.value = event?.status ?? "scheduled";
    note.value = event?.note ?? null;
  },
  { immediate: true },
);

watch(isVisible, (visible) => {
  if (!visible) emit("close");
});

// Заняття, що вже почалось, не може бути "запланованим",
// а те, що ще не почалось, - "проведеним"
const availableStatusOptions = computed(() => {
  if (!props.event) return LESSON_STATUS_OPTIONS;

  const isStarted = new Date(props.event.start) <= new Date();
  const hiddenStatus: LessonStatus = isStarted ? "scheduled" : "happened";
  const options = LESSON_STATUS_OPTIONS.filter((o) => o.value !== hiddenStatus);

  // Якщо поточний статус відфільтрувався - показуємо всі, щоб не зламати Select
  return options.some((o) => o.value === status.value)
    ? options
    : LESSON_STATUS_OPTIONS;
});

const askToRefundLesson = async () => {
  const studentId = props.event?.students[0]?.user_id;
  if (!studentId) return;

  const buttonId = await popup?.showPopup?.({
    message: "Ви хочете додати +1 до числа оплачених занять цьому учню?",
    buttons: [
      { id: "yes", type: "default", text: "Додати" },
      { id: "cancel", type: "cancel", text: "Ні" },
    ],
  });

  if (buttonId === "yes") {
    await incrementPaidLessons(getCurrentUserId(), studentId);
  }
};

const onStatusChange = async () => {
  const attendanceId = props.event?.attendance_id;
  if (!attendanceId) return;

  try {
    if (status.value === "canceled") {
      await askToRefundLesson();
    }

    const { error } = await supabase
      .from("attendances")
      .update({ status: status.value })
      .eq("id", attendanceId);

    if (error) throw error;
  } catch (error) {
    notify.error("Не вдалося змінити статус", error);
  }
};

const saveNote = async (text: string) => {
  const attendanceId = props.event?.attendance_id;
  if (!attendanceId) return;

  const { error } = await supabase
    .from("attendances")
    .update({ note: text })
    .eq("id", attendanceId);

  if (error) {
    notify.error("Не вдалося зберегти примітку", error);
    return;
  }

  note.value = text;
};
</script>
