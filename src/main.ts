import { createApp } from "vue";
import PrimeVue from "primevue/config";
import ToastService from "primevue/toastservice";
import Aura from "@primeuix/themes/aura";
import "primeicons/primeicons.css";
import "./assets/styles/index.css";

import App from "./App.vue";
import router from "./router";
import { initSession } from "./lib/session";
import { primeVueLocaleUk } from "./constants/locale";

const app = createApp(App)
  .use(router)
  .use(ToastService)
  .use(PrimeVue, {
    theme: {
      preset: Aura,
      options: { darkModeSelector: false },
    },
    locale: primeVueLocaleUk,
  });

// Сторінки одразу звертаються до session, тому монтуємо застосунок
// лише після того, як сесія відновлена з localStorage
initSession().finally(() => app.mount("#app"));
