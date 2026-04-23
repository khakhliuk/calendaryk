import { createApp } from "vue";
import "./assets/styles/index.css";
import App from "./App.vue";
import router from "./router";
import PrimeVue from "primevue/config";
import Aura from "@primeuix/themes/aura";
import ToastService from "primevue/toastservice";
import "primeicons/primeicons.css";
import { initSession } from "./lib/session";

await initSession();

createApp(App)
  .use(router)
  .use(ToastService)
  .use(PrimeVue, {
    theme: {
      preset: Aura,
      options: {
        darkModeSelector: false,
      },
    },
    locale: {
      dayNames: [
        "Неділя",
        "Понеділок",
        "Вівторок",
        "Середа",
        "Четвер",
        "П'ятниця",
        "Субота",
      ],
      dayNamesShort: ["Нд", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"],
      dayNamesMin: ["Нд", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"],
      monthNames: [
        "Січень",
        "Лютий",
        "Березень",
        "Квітень",
        "Травень",
        "Червень",
        "Липень",
        "Серпень",
        "Вересень",
        "Жовтень",
        "Листопад",
        "Грудень",
      ],
      monthNamesShort: [
        "Січ",
        "Лют",
        "Бер",
        "Кві",
        "Тра",
        "Чер",
        "Лип",
        "Сер",
        "Вер",
        "Жов",
        "Лис",
        "Гру",
      ],
    },
  })
  .mount("#app");
