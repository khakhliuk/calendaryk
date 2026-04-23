<template>
  <header class="bg-white border-b border-gray-100 px-4 py-2">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div
          class="w-8 h-8 rounded-xl bg-blue-500 flex items-center justify-center"
        >
          <i class="pi pi-calendar text-white text-sm" />
        </div>
        <div>
          <h1 class="text-m font-semibold text-gray-900 leading-tight">
            Calendary
          </h1>
        </div>
      </div>

      <div
        class="flex items-center gap-2 rounded-3xl border-gray-200"
        @click="router.push('/settings')"
      >
        <i class="pi pi-cog text-gray-700 p-1" style="font-size: 1.4rem"></i>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
const router = useRouter();
</script>

<style scoped>
/* Локальные стили компонента */
</style>
