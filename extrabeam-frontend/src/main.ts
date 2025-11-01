// src/main.ts
import { createApp } from "vue";
import { createPinia } from "pinia";
import "./style.css";
import App from "./App.vue";
import router from "./router"; // ✅ import du default

// import { supabase } from "./services/supabase";

// supabase.auth.getSession().then(({ data }) => {
//   console.log("Session au démarrage:", data.session);
// });

const app = createApp(App);

app.use(createPinia());
app.use(router); // ✅ fonctionne si c'est bien une instance
app.mount("#app");
