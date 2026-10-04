<template>
  <div
    class="min-h-screen bg-white flex flex-col items-center justify-center p-6 select-none"
  >
    <div class="flex flex-col items-center text-center max-w-md">
      <div class="flex items-center gap-4 mb-8">
        <span
          v-for="(digit, index) in '404'"
          :key="index"
          class="text-8xl font-thin text-slate-800"
        >
          {{ digit }}
        </span>
      </div>

      <h1 class="text-xl text-slate-600 mb-2 font-sans">
        Сторінку не знайдено
      </h1>
      <p class="text-slate-400 text-sm mb-8 leading-relaxed">
        Можливо, ви перейшли за хибним посиланням або сторінку було видалено.
      </p>
    </div>
  </div>
</template>
