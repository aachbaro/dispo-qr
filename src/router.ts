// src/router.ts
import { createRouter, createWebHistory } from "vue-router";
import type { Router } from "vue-router";
import Home from "./pages/Home.vue";
import EntreprisePage from "./pages/EntreprisePage.vue";
import FacturePage from "./pages/FacturePage.vue";
import RegisterPage from "./pages/auth/RegisterPage.vue";
import ClientPage from "./pages/ClientPage.vue";

const routes = [
  { path: "/", component: Home },
  { path: "/client", component: ClientPage },
  { path: "/entreprise/:slug", component: EntreprisePage, props: true },
  {
    path: "/entreprise/:ref/factures/:id",
    name: "facture",
    component: FacturePage,
    props: true,
  },
  {
    path: "/register", // 👈 nouvelle route
    name: "register",
    component: RegisterPage,
  },
];

const router: Router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
