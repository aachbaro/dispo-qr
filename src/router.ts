// src/router.ts
import { createRouter, createWebHistory } from "vue-router";
import type { Router } from "vue-router";
import Home from "./pages/Home.vue";
import EntreprisePage from "./pages/EntreprisePage.vue"; // 👈 nouvelle page

const routes = [
  { path: "/", component: Home },
  { path: "/entreprise/:slug", component: EntreprisePage, props: true }, // 👈
];

const router: Router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
