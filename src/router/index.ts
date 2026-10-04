import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";
import Login from "../views/Login.vue";

const routes: RouteRecordRaw[] = [
  { path: "/", name: "Login", component: Login },
  {
    path: "/connect",
    name: "ConnectToTeacher",
    component: () => import("../views/ConnectToTeacher.vue"),
  },
  {
    path: "/dashboard",
    name: "Home",
    component: () => import("../views/Home.vue"),
  },
  {
    path: "/history",
    name: "History",
    component: () => import("../views/History.vue"),
  },
  {
    path: "/students",
    name: "Students",
    component: () => import("../views/Students.vue"),
  },
  {
    path: "/group/:id?",
    name: "GroupEdit",
    component: () => import("../views/GroupEdit.vue"),
  },
  {
    path: "/student/:id",
    name: "StudentEdit",
    component: () => import("../views/StudentEdit.vue"),
  },
  {
    path: "/settings",
    name: "Settings",
    component: () => import("../views/Settings.vue"),
  },
  {
    path: "/teacher",
    name: "Teacher",
    component: () => import("../views/Teacher.vue"),
  },
  {
    path: "/:pathMatch(.*)*",
    name: "NotFound",
    component: () => import("../views/NotFound.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  },
});

export default router;
