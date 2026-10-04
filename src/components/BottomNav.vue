<template>
  <nav
    class="fixed justify-center bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3"
  >
    <div class="flex items-center justify-around mt-1 text-gray-700">
      <button
        v-for="item in navItems"
        :key="item.path"
        class="bg-transparent border-none cursor-pointer"
        @click="router.push(item.path)"
      >
        <i
          class="pi px-2 rounded-lg"
          style="font-size: 1.5rem"
          :class="[
            item.icon,
            { 'border-b-4 border-blue-300 pb-1 text-gray-900': isActive(item.path) },
          ]"
        />
      </button>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { isTeacher } from "../lib/session";

const route = useRoute();
const router = useRouter();

const teacherItems = [
  { path: "/students", icon: "pi-users" },
  { path: "/dashboard", icon: "pi-home" },
  { path: "/history", icon: "pi-history" },
];

const studentItems = [
  { path: "/teacher", icon: "pi-graduation-cap" },
  { path: "/dashboard", icon: "pi-home" },
  { path: "/settings", icon: "pi-cog" },
];

const navItems = computed(() => (isTeacher.value ? teacherItems : studentItems));

const isActive = (path: string) => route.path === path;
</script>
