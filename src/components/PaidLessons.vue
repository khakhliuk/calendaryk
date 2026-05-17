<template>
  <div class="flex flex-col gap-1">
    <div class="flex items-center gap-1">
      <ToggleSwitch v-model="enabled" @update:model-value="onToggle" />
      <span class="text-sm font-medium text-gray-700">Оплачені заняття</span>
    </div>

    <div v-if="enabled" class="flex flex-col gap-1">
      <span class="text-xs text-gray-500 pb-1">
        (Зменшується автоматично)
      </span>
      <div class="flex gap-1 items-center">
        <InputNumber
          v-model="inputValue"
          :min="0"
          showButtons
          buttonLayout="horizontal"
          :step="1"
          inputClass="w-12 text-center font-medium"
          class="paid-input"
          :class="{
            'paid-positive': inputValue > 0,
            'paid-zero': inputValue === 0,
            'paid-negative': inputValue < 0,
          }"
        >
          <template #incrementicon>
            <i class="pi pi-plus" />
          </template>
          <template #decrementicon>
            <i class="pi pi-minus" />
          </template>
        </InputNumber>
        <Button
          v-if="hasChanges"
          label="Зберегти"
          severity="info"
          @click="save"
          class="shrink-0"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from "vue";

const props = defineProps<{ value: number | null }>();
const emit = defineEmits<{
  save: [value: number];
  disable: [];
}>();

const initialValue = ref(props.value ?? 0);
const hasChanges = computed(() => inputValue.value !== initialValue.value);
const enabled = ref(props.value !== null);
const inputValue = ref(props.value ?? 0);

watch(
  () => props.value,
  (val) => {
    enabled.value = val !== null;
    inputValue.value = val ?? 0;
    initialValue.value = val ?? 0;
  },
);

const onToggle = (val: boolean) => {
  if (!val) {
    initialValue.value = 0;
    inputValue.value = 0;
    emit("disable");
  }
};

const save = () => {
  emit("save", inputValue.value);
  initialValue.value = inputValue.value;
};
</script>

<style scoped>
.paid-positive :deep(input) {
  color: #22c55e;
}
.paid-zero :deep(input) {
  color: #9ca3af;
}
.paid-negative :deep(input) {
  color: #ef4444;
}
</style>
