import { ref } from "vue";

type AuthUser = {
  id: string;
  email: string;
  role: string;
  slug?: string;
};

const stored = localStorage.getItem("authUser");
const user = ref<AuthUser | null>(stored ? JSON.parse(stored) : null);

export function useAuth() {
  function setUser(newUser: AuthUser | null) {
    user.value = newUser;
    if (newUser) {
      localStorage.setItem("authUser", JSON.stringify(newUser));
    } else {
      localStorage.removeItem("authUser");
    }
  }

  return { user, setUser };
}
