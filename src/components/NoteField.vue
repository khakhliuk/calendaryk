<template>
  <div>
    <div v-if="!isEditing">
      <div v-if="note" class="flex items-start gap-1 text-gray-600">
        <i class="pi pi-comment mt-1 mr-1" />
        <span
          :class="{ 'cursor-pointer hover:text-gray-800': isTeacher }"
          @click="startEditing"
        >
          {{ note }}
        </span>
      </div>
      <div
        v-else-if="isTeacher"
        class="text-sm text-gray-400 cursor-pointer hover:text-gray-600 transition-colors"
        @click="startEditing"
      >
        <i class="pi pi-pencil mr-1" style="font-size: 0.75rem" />
        Додати примітку...
      </div>
    </div>

    <div v-else class="flex flex-col gap-1">
      <Textarea
        v-model="noteText"
        autoResize
        rows="2"
        placeholder="Введіть примітку..."
        class="w-full text-sm"
        autofocus
      />
      <div class="flex gap-1 justify-end">
        <Button
          label="Скасувати"
          size="small"
          severity="secondary"
          variant="text"
          @click="cancel"
        />
        <Button label="Зберегти" size="small" severity="info" @click="save" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { isTeacher } from "../lib/session";

const props = defineProps<{ note: string | null }>();
const emit = defineEmits<{ save: [value: string] }>();

const isEditing = ref(false);
const noteText = ref("");

watch(
  () => props.note,
  (value) => {
    noteText.value = value ?? "";
  },
  { immediate: true },
);

// Редагувати примітки може лише вчитель
const startEditing = () => {
  if (isTeacher.value) isEditing.value = true;
};

const save = () => {
  emit("save", noteText.value);
  isEditing.value = false;
};

const cancel = () => {
  noteText.value = props.note ?? "";
  isEditing.value = false;
};
</script>
