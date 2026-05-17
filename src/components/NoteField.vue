<script setup lang="ts">
import { ref, watch } from "vue";
import { isTeacher } from "../lib/session";

const props = defineProps<{ note: string | null }>();
const emit = defineEmits<{ save: [value: string] }>();

const isEditing = ref(false);
const noteText = ref(props.note ?? "");

const save = () => {
  emit("save", noteText.value);
  isEditing.value = false;
};

const cancel = () => {
  noteText.value = props.note ?? "";
  isEditing.value = false;
};

watch(
  () => props.note,
  (val) => {
    noteText.value = val ?? "";
  },
  { immediate: true },
);
</script>

<template>
  <div>
    <div v-if="!isEditing">
      <div v-if="note" class="flex items-start gap-1 text-gray-600">
        <i class="pi pi-comment mt-1 mr-1" />
        <span
          :class="isTeacher ? 'cursor-pointer hover:text-gray-800' : ''"
          @click="isTeacher && (isEditing = true)"
        >
          {{ note }}
        </span>
      </div>
      <div
        v-else
        class="text-sm text-gray-400"
        :class="
          isTeacher
            ? 'cursor-pointer hover:text-gray-600 transition-colors'
            : ''
        "
        @click="isTeacher && (isEditing = true)"
      >
        <template v-if="isTeacher">
          <i class="pi pi-pencil mr-1" style="font-size: 0.75rem" />
          Додати примітку...
        </template>
      </div>
    </div>
    <div v-else-if="isTeacher" class="flex flex-col gap-1">
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
