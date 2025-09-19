// src/main.ts
import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";
import router from "./router"; // ✅ import du default

const app = createApp(App);
app.use(router); // ✅ fonctionne si c'est bien une instance
app.mount("#app");