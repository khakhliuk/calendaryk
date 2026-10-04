<template>
  <div class="space-y-1 mb-4">
    <label class="block text-sm font-medium text-gray-700">{{ title }}</label>
    <div class="space-y-1 border border-gray-300 rounded-lg p-3">
      <div v-if="items.length" class="space-y-2 mb-1">
        <div
          v-for="item in items"
          :key="item.id"
          class="flex items-center justify-between rounded-lg bg-gray-200 border border-gray-300"
        >
          <span class="pl-2">
            {{ format(new Date(item.date), dateFormat, { locale: uk }) }}
          </span>
          <Button
            icon="pi pi-delete-left"
            class="text-red-600 ml-2 w-10"
            severity="danger"
            raised
            @click="emit('remove', item.id)"
          />
        </div>
      </div>
      <div v-else class="text-center py-1">
        <p class="text-gray-500">Список пустий.</p>
      </div>
      <Button
        :label="addLabel"
        severity="info"
        variant="text"
        :loading="loading"
        class="w-full"
        @click="emit('add')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { format } from "date-fns";
import { uk } from "date-fns/locale";

defineProps<{
  title: string;
  items: { id: string; date: string }[];
  dateFormat: string;
  addLabel: string;
  loading?: boolean;
}>();

const emit = defineEmits<{
  add: [];
  remove: [id: string];
}>();
</script>
