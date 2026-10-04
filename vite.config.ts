import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import Components from "unplugin-vue-components/vite";
import { PrimeVueResolver } from "@primevue/auto-import-resolver";

export default defineConfig({
  plugins: [
    vue(),
    // Автоімпорт компонентів PrimeVue
    Components({
      resolvers: [PrimeVueResolver()],
    }),
  ],
  server: {
    host: "0.0.0.0",
    port: 3000,
  },
});
