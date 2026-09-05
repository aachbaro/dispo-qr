import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

const LuluApp = lazy(() => import("./lulu/LuluApp"));
const LuluDeveloperPage = lazy(() => import("./lulu/LuluDeveloperPage"));

export default function App() {
  return (
    <BrowserRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route
          path="/lulu/admin"
          element={
            <Suspense fallback={<p role="status">Chargement…</p>}>
              <LuluDeveloperPage />
            </Suspense>
          }
        />
        <Route
          path="/lulu/*"
          element={
            <Suspense fallback={<p role="status">Chargement de Lulu…</p>}>
              <LuluApp />
            </Suspense>
          }
        />
        <Route path="*" element={<Navigate to="/lulu" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
