<template>
  <nav
    class="fixed justify-center bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3"
  >
    <div class="flex items-center justify-around mt-1 text-gray-700">
      <button v-if="isUserTeacher" @click="router.push('/students')">
        <i
          class="pi pi-users px-2 rounded-lg"
          :class="
            isActive('/students') &&
            'border-b-4 border-blue-300 pb-1 text-gray-900'
          "
          style="font-size: 1.5rem"
        />
      </button>

      <button v-else @click="router.push('/teacher')">
        <i
          class="pi pi-graduation-cap px-2 rounded-lg"
          :class="
            isActive('/teacher') &&
            'border-b-4 border-blue-300 pb-1 text-gray-900'
          "
          style="font-size: 1.5rem"
        />
      </button>

      <button @click="router.push('/dashboard')">
        <i
          class="pi pi-home px-2 rounded-lg"
          :class="
            isActive('/dashboard') &&
            'border-b-4 border-blue-300 pb-1 text-gray-900'
          "
          style="font-size: 1.5rem"
        />
      </button>

      <button v-if="isUserTeacher" @click="router.push('/history')">
        <i
          class="pi pi-history px-2 rounded-lg"
          :class="
            isActive('/history') &&
            'border-b-4 border-blue-300 pb-1 text-gray-900'
          "
          style="font-size: 1.5rem"
        />
      </button>

      <button v-else @click="router.push('/settings')">
        <i
          class="pi pi-cog px-2 rounded-lg"
          :class="
            isActive('/settings') &&
            'border-b-4 border-blue-300 pb-1 text-gray-900'
          "
          style="font-size: 1.5rem"
        />
      </button>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from "vue-router";
import { session, isTeacher } from "../lib/session";
import { computed } from "vue";

const route = useRoute();
const router = useRouter();

const isActive = (path: string) => route.path === path;

const isUserTeacher = computed(() => {
  return session.value && isTeacher.value;
});
</script>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-around;
  background: #f8f8f8;
  border-top: 1px solid #ccc;
}

button {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
}
</style>
