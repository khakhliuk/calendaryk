<template>
  <div id="app" class="flex flex-col h-svh overflow-hidden scrollbar-none">
    <main
      class="bg-gray-50 flex-1 overflow-y-auto scrollbar-none"
      :style="{
        paddingBottom: showBottomNav ? '62px' : '0',
      }"
    >
      <router-view />
    </main>
    <BottomNav
      v-if="showBottomNav"
      class="fixed bottom-0 left-0 right-0 h-16 z-50"
    />
    <Toast
      position="top-center"
      :style="{ width: '90vw', maxWidth: '400px' }"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { session } from "./lib/session";
import { useSettingsButton } from "vue-tg";
import { useMiniApp } from "vue-tg";

import BottomNav from "./components/BottomNav.vue";
import { useRouter } from "vue-router";

const miniApp = useMiniApp();
miniApp.onActive?.(async () => {
  window.location.reload();
});

const router = useRouter();
const route = useRoute();
const settingsButton = useSettingsButton();
settingsButton?.show?.();
settingsButton?.onClick?.(() => {
  router.push("/settings");
});

const hiddenBottomRoutes = ["/", "/connect", "/404", "/student-dashboard"];
const showBottomNav = computed(() => {
  return session.value && !hiddenBottomRoutes.includes(route.path);
});
</script>

<style scoped>
#app {
  height: calc(100svh-var("20px"));
  display: flex;
  flex-direction: column;
}

main {
  flex: 1;
}
</style>
