<template>
  <Dialog
    v-model:visible="isVisible"
    modal
    :header="props.event?.title ?? 'Заняття'"
    :style="{ width: '90vw', maxWidth: '400px' }"
  >
    <div v-if="props.event" class="flex flex-col gap-3">
      <!-- Дата і час -->
      <div class="flex items-center gap-2 text-sm text-gray-600">
        <i class="pi pi-clock" />
        <span>{{
          format(new Date(props.event.start), "HH:mm, dd.MM.yyyy")
        }}</span>
      </div>
      <div v-if="props.event.attendance_id !== null && isTeacher">
        <span class="text-sm text-gray-500">Статус</span>
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
      <div v-else class="flex items-center gap-2">
        <i class="pi pi-info-circle" />
        <Tag
          :value="statusLabel(props.event.status)"
          :severity="statusSeverity(props.event.status)"
        />
      </div>

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
      <Button
        v-if="props.event.link && props.event.status !== 'canceled'"
        as="a"
        label="Приєднатись"
        severity="info"
        size="small"
        :href="props.event.link"
        target="_blank"
        rel="noopener"
      />
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, watch } from "vue";
import type { CalEvent } from "../models/getScheduleModel.js";
import { supabase } from "../lib/supabaseClient.js";
import { useToast } from "primevue/usetoast";
const toast = useToast();
import { format } from "date-fns";
import { isTeacher } from "../lib/session";

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

  // 🔥 важливо: не ламаємо поточний статус
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
  if (status === "happened") return "success";
  if (status === "canceled") return "danger";
  return "info";
};

const onStatusChange = async (event: CalEvent) => {
  if (!event.attendance_id) return;

  const { error } = await supabase
    .from("attendances")
    .update({ status: event.status })
    .eq("id", event.attendance_id);

  if (error) {
    toast.add({
      severity: "error",
      summary: "Помилка: " + error.message,
      life: 3000,
    });
  }
};
</script>
