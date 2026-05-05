import type { AuthResponse } from "../api";

export const mockLogin = async (email: string, password: string): Promise<AuthResponse> => {
  await new Promise((resolve) => setTimeout(resolve, 800));
  if (password === "test") {
    return {
      user: {
        id: "mock-uuid-1234",
        slug: "mock-adam",
        email,
        display_name: email.split("@")[0],
        avatar_url: null,
        role: "freelance",
        token: "mock-token",
      },
      access_token: "mock-token"
    };
  }
  throw new Error("Identifiants incorrects");
};

export const mockGoogleLogin = async (_code: string): Promise<AuthResponse> => {
  await new Promise((resolve) => setTimeout(resolve, 800));
  return {
    user: {
      id: "google-uuid-5678",
      slug: "adam",
      email: "adam@gmail.com",
      display_name: "Adam",
      avatar_url: "https://i.pravatar.cc/80",
      role: "freelance",
      token: "mock-google-token",
    },
    access_token: "mock-google-token"
  };
};

export const mockRegister = async (display_name: string, email: string, password: string): Promise<AuthResponse> => {
  await new Promise((resolve) => setTimeout(resolve, 800));

  if (password.length < 8) {
    throw new Error("Le mot de passe doit contenir au moins 8 caracteres.");
  }

  return {
    user: {
      id: "mock-register-9012",
      slug: "mock-register",
      email,
      display_name: display_name.trim() || email.split("@")[0],
      avatar_url: null,
      role: "freelance",
      token: "mock-register-token",
    },
    access_token: "mock-register-token"
  };
};
