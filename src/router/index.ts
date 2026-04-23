import { createRouter, createWebHistory } from "vue-router";
import Home from "../views/Home.vue";
import LogIn from "../views/Login.vue";
import Calendar from "../views/Calendar.vue";
import Students from "../views/Students.vue";
import GroupEdit from "../views/GroupEdit.vue";
import Settings from "../views/Settings.vue";
import StudentEdit from "../views/StudentEdit.vue";
import ConnectToTeacher from "../views/ConnectToTeacher.vue";
import History from "../views/History.vue";
import Teacher from "../views/Teacher.vue";
import NotFound from "../views/404.vue";

const routes = [
  { path: "/", name: "Login", component: LogIn },
  { path: "/connect", name: "ConnectToTeacher", component: ConnectToTeacher },
  { path: "/dashboard", name: "Home", component: Home },
  { path: "/history", name: "History", component: History },
  { path: "/calendar", name: "Calendar", component: Calendar },
  { path: "/students", name: "Students", component: Students },
  { path: "/group", name: "GroupEdit", component: GroupEdit },
  { path: "/settings", name: "Settings", component: Settings },
  { path: "/student", name: "StudentEdit", component: StudentEdit },
  { path: "/teacher", name: "Teacher", component: Teacher },
  { path: "/404", name: "NotFound", component: NotFound },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  },
});

export default router;
