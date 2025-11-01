import { defineStore } from "pinia";

export interface AuthUser {
  id: string;
  email?: string | null;
  role?: string | null;
  slug?: string | null;
}

export const useUserStore = defineStore("user", {
  state: () => ({
    user: null as AuthUser | null,
  }),

  getters: {
    isLoggedIn: (state) => !!state.user,
  },

  actions: {
    setUser(user: AuthUser | null) {
      this.user = user;
    },
  },
});
