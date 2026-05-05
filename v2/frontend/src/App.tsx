/**
 * src/App.tsx
 * Layer  : Frontend — racine de l'application
 * Role   : Configure le router React et les providers globaux.
 * Routes :
 *   /              → redirect /login
 *   /login         → LoginPage
 *   /register      → RegisterPage
 *   /auth/callback → AuthCallbackPage (post-OIDC)
 *   /profile       → ProfilePage (redirect vers /p/:slug ou fallback)
 *   /p/:slug       → FreelancerProfilePage (page publique d'un profil)
 */

import { GoogleOAuthProvider } from "@react-oauth/google";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import AdminAccountPage from "./pages/AdminAccountPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import { UserProvider } from "./context/UserContext";
import AuthCallbackPage from "./pages/AuthCallbackPage";
import ClientDashboardPage from "./pages/ClientDashboardPage";
import FreelancerProfilePage from "./pages/FreelancerProfilePage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import RegisterPage from "./pages/RegisterPage";

export default function App() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || "dev-google-client"}>
      <UserProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/client" element={<ClientDashboardPage />} />
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/accounts/:accountId" element={<AdminAccountPage />} />
            <Route path="/p/:slug" element={<FreelancerProfilePage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </UserProvider>
    </GoogleOAuthProvider>
  );
}
