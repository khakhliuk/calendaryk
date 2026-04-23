<template>
  <div
    class="min-h-screen bg-white flex flex-col items-center justify-center p-6 select-none"
  >
    <div class="flex flex-col items-center text-center max-w-md">
      <!-- Google-style 404 number -->
      <div class="flex items-center gap-4 mb-8">
        <span class="text-8xl font-thin text-slate-800">4</span>

        <span class="text-8xl font-thin text-slate-800">0</span>
        <span class="text-8xl font-thin text-slate-800">4</span>
      </div>

      <h1
        class="text-xl text-slate-600 mb-2"
        style="font-family: Arial, sans-serif"
      >
        Сторінку не знайдено
      </h1>
      <p class="text-slate-400 text-sm mb-8 leading-relaxed">
        Можливо, ви перейшли за хибним посиланням або сторінку було видалено.
      </p>
    </div>

    <!-- Google-style footer -->
    <!-- <div class="absolute bottom-6 flex gap-6">
      <span class="text-xs text-slate-400">Звітувати про проблему</span>
    </div> -->
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
</script>
