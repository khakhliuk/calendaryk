<template>
  <ExpandedViewport />
  <div id="app" class="h-dvh overflow-hidden flex flex-col">
    <main class="flex-1 bg-gray-50 overflow-y-auto pb-[65px]">
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
import { computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useMiniApp, useSettingsButton, ExpandedViewport } from "vue-tg";
import { supabase } from "./lib/supabaseClient";
import { session } from "./lib/session";
import BottomNav from "./components/BottomNav.vue";

const ROUTES_WITHOUT_NAV = ["Login", "ConnectToTeacher", "NotFound"];

const miniApp = useMiniApp();
const router = useRouter();
const route = useRoute();

const settingsButton = useSettingsButton();
settingsButton?.show?.();
settingsButton?.onClick?.(() => router.push({ name: "Settings" }));

const showBottomNav = computed(
  () => !!session.value && !ROUTES_WITHOUT_NAV.includes(String(route.name)),
);

// Коли міні-апп повертається з фону, сесія могла оновитись
const refreshSession = async () => {
  const { data } = await supabase.auth.getSession();
  session.value = data.session;
};

onMounted(() => {
  miniApp.onActive?.(refreshSession);
});
</script>
