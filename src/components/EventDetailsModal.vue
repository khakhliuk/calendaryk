<template>
  <Dialog
    v-model:visible="isVisible"
    modal
    :header="props.event?.title ?? 'Заняття'"
    :style="{ width: '90vw', maxWidth: '400px' }"
  >
    <div v-if="props.event" class="flex flex-col gap-1">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2 text-sm text-gray-600">
          <i class="pi pi-clock" />
          <span>{{
            format(new Date(props.event.start), "HH:mm, dd.MM.yyyy")
          }}</span>
        </div>
      </div>
      <NoteField
        v-if="props.event.attendance_id"
        :note="props.event.note"
        @save="
          (text: string) => saveNote(props.event!.attendance_id ?? null, text)
        "
      />
      <div v-if="props.event.attendance_id && isTeacher">
        <div class="flex flex-col">
          <span class="text-sm text-gray-500"> Статус </span>
          <!-- <span class="text-xs text-gray-500 pb-1">
            (учень отримає сповіщення про зміни)
          </span> -->
        </div>
        <Select
          v-model="props.event.status"
          :options="filteredStatusOptions"
          @change="onStatusChange(props.event)"
          optionLabel="label"
          optionValue="value"
          class="w-full"
        >
          <template #option="slotProps">
            <span :class="getTextColor(slotProps.option.value)">
              {{ slotProps.option.label }}
            </span>
          </template>

          <template #value="slotProps">
            <span :class="getTextColor(slotProps.value)">
              {{
                statusOptions.find((o) => o.value === slotProps.value)?.label
              }}
            </span>
          </template>
        </Select>
      </div>
      <div v-else class="flex items-center gap-2 mt-1">
        <i class="pi pi-info-circle" />
        <Tag
          :value="statusLabel(props.event.status)"
          :severity="statusSeverity(props.event.status)"
        />
      </div>

      <Button
        class="mt-2"
        v-if="props.event.link && props.event.status !== 'canceled'"
        as="a"
        label="Приєднатись"
        severity="info"
        size="small"
        :href="props.event.link"
        target="_blank"
        rel="noopener"
      />

      <!-- Список студентів -->
      <!-- <div v-if="selectedEvent.students?.length" class="flex flex-col gap-1">
        <label class="text-xs text-gray-500">Учасники</label>
        <div
          v-for="student in selectedEvent.students"
          :key="student.user_id"
          class="flex items-center justify-between py-1 border-b border-gray-100 last:border-0"
        >
          <div class="flex items-center gap-2 text-sm">
            <i class="pi pi-user text-gray-400" />
            <span>{{ student.name }}</span>
          </div>
          <Tag
            :value="statusLabel(student.status)"
            :severity="statusSeverity(student.status)"
            class="text-xs"
          />
        </div>
      </div> -->
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, watch } from "vue";
import type { CalEvent } from "../models/getScheduleModel.js";
import { createSupabaseDbClient } from "../lib/supabaseClient.js";
import { useToast } from "primevue/usetoast";
import { format } from "date-fns";
import { isTeacher } from "../lib/session";
import { usePopup } from "vue-tg";
const popup = usePopup();

const toast = useToast();
const supabase = createSupabaseDbClient();
const props = defineProps<{
  event: CalEvent | null;
}>();

const isVisible = defineModel<boolean>();
const emit = defineEmits(["submit"]);

watch(isVisible, (val) => {
  if (!val) {
    emit("submit");
  }
});

const statusOptions = [
  { label: "Заплановано", value: "scheduled" },
  { label: "Відбулось", value: "happened" },
  { label: "Скасовано", value: "canceled" },
];

const now = new Date();
const isStarted = computed(() => {
  if (!props.event?.start) return false;

  const start = new Date(props.event.start);
  return !isNaN(start.getTime()) && start <= now;
});

const filteredStatusOptions = computed(() => {
  if (!props.event) return statusOptions;

  let options = statusOptions;

  if (isStarted.value) {
    options = options.filter((s) => s.value !== "scheduled");
  } else {
    options = options.filter((s) => s.value !== "happened");
  }

  if (!options.find((o) => o.value === props.event!.status)) {
    return statusOptions;
  }

  return options;
});

const getTextColor = (status: string) => {
  if (status === "happened") return "text-gray-600";
  if (status === "canceled") return "text-red-500";
  return "text-blue-600";
};

const statusLabel = (status: string) => {
  return statusOptions.find((s) => s.value === status)?.label ?? status;
};

const statusSeverity = (status: string) => {
  if (status === "happened") return "secondary";
  if (status === "canceled") return "danger";
  return "info";
};

const onStatusChange = async (event: CalEvent) => {
  try {
    if (!event.attendance_id) return;

    if (event.status === "canceled") {
      const buttonId = await popup?.showPopup?.({
        message: "Ви хочете додати +1 до числа оплачених занять цьому учню?",
        buttons: [
          {
            id: "yes",
            type: "default",
            text: "Додати",
          },
          {
            id: "cancel",
            type: "cancel",
            text: "Ні",
          },
        ],
      });

      if (buttonId === "yes") {
        console.log("confirmed");
      }
    }

    const { error } = await supabase
      .from("attendances")
      .update({ status: event.status })
      .eq("id", event.attendance_id);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error(error);
    toast.add({
      severity: "error",
      summary: "Помилка: \n" + error,
      life: 3000,
    });
  }
};

const saveNote = async (attendanceId: string | null, text: string) => {
  if (!attendanceId) return;
  console.log(
    "Saving note for attendance ID:",
    attendanceId,
    "with text:",
    text,
  );
  const { error } = await supabase
    .from("attendances")
    .update({ note: text })
    .eq("id", attendanceId);

  if (error) {
    console.error(error);
    toast.add({
      severity: "error",
      summary: "Помилка: " + error.message,
      life: 3000,
    });
  }

  props.event!.note = text;
};
</script>
