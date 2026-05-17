<template>
  <ExpandedViewport />
  <div id="app" class="h-dvh overflow-hidden flex flex-col">
    <main
      class="flex-1 bg-gray-50 overflow-y-auto"
      style="padding-bottom: 65px"
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
import { computed, onMounted, onUnmounted } from "vue";
import { supabase } from "./lib/supabaseClient";
import { useRoute } from "vue-router";
import { session } from "./lib/session";
import { useSettingsButton } from "vue-tg";
import { useMiniApp, ExpandedViewport } from "vue-tg";

import BottomNav from "./components/BottomNav.vue";
import { useRouter } from "vue-router";

const miniApp = useMiniApp();
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

const refreshAppState = async () => {
  const { data } = await supabase.auth.getSession();
  session.value = data.session;
};

const onResume = () => {
  if (!document.hidden) {
    refreshAppState();
  }
};

onMounted(() => {
  miniApp.onActive?.(() => {
    refreshAppState();
  });
});

onUnmounted(() => {
  document.removeEventListener("visibilitychange", onResume);
  window.removeEventListener("focus", onResume);
});
</script>

<style scoped></style>
