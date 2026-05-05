/**
 * src/pages/FreelancerProfilePage.tsx
 * Layer  : Frontend — pages
 * Role   : Page de profil d'un freelance (accessible par tout le monde via /p/:slug).
 *          Affiche la ProfileCard + Agenda + Missions + Indisponibilités (owner).
 *          Si l'utilisateur connecté consulte son propre slug et que le profil
 *          est introuvable (404), relance automatiquement le flux OIDC pour
 *          initialiser le profil en base (une seule tentative via sessionStorage).
 * Route  : /p/:slug
 * Data   : GET /api/profiles/:slug/ → ProfileOverview (profile + unavailabilities + mode)
 */

import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";

import { fetchProfileOverview, getOidcLoginUrl } from "../api";
import Agenda from "../components/agenda/Agenda";
import FacturesSection from "../components/factures/FacturesSection";
import MissionsSection from "../components/missions/MissionsSection";
import ProfileCard from "../components/ProfileCard";
import Topbar from "../components/Topbar";
import UnavailabilitySection from "../components/unavailabilities/UnavailabilitySection";
import { useUserContext } from "../context/UserContext";
import type { FreelancerProfile, Mission, ProfileOverview, Unavailability } from "../types";

const REFRESH_KEY = "eb_profile_refresh_attempted";

export default function FreelancerProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  const { user, clearUser } = useUserContext();

  const [profile, setProfile] = useState<FreelancerProfile | null>(null);
  const [unavailabilities, setUnavailabilities] = useState<Unavailability[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Évite la boucle 404 → OIDC → 404 si le backend échoue quand même.
  const alreadyTriedRefresh = useRef(sessionStorage.getItem(REFRESH_KEY) === slug);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(null);

    fetchProfileOverview(slug, user?.token)
      .then((overview: ProfileOverview) => {
        sessionStorage.removeItem(REFRESH_KEY);
        setProfile(overview.profile);
        setUnavailabilities(overview.unavailabilities);
        setIsOwner(overview.mode === "owner");
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [slug, user?.token]);

  // --- Chargement ---
  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-eb-page">
        <p className="text-[14px] text-eb-secondary">Chargement…</p>
      </main>
    );
  }

  if (profile?.role === "client" && isOwner) {
    return <Navigate to="/client" replace />;
  }

  // --- Profil introuvable ---
  if (error || !profile || !slug) {
    const isOwnBrokenProfile = !!user?.slug && user.slug === slug;

    if (isOwnBrokenProfile && !alreadyTriedRefresh.current) {
      sessionStorage.setItem(REFRESH_KEY, slug);
      clearUser();
      window.location.href = getOidcLoginUrl();
      return null;
    }

    return (
      <main className="flex min-h-screen items-center justify-center bg-eb-page px-6">
        <div className="w-full max-w-md rounded-eb-card border border-eb-layout bg-white p-8">
          <p className="font-logo text-[28px] text-eb-text">ExtraBeam</p>
          <h1 className="mt-6 text-[22px] font-semibold text-eb-text">Profil introuvable</h1>
          <p className="mt-3 text-[14px] leading-6 text-eb-secondary">
            {isOwnBrokenProfile
              ? "La reconnexion n'a pas pu initialiser ton profil. Réessaie ou contacte le support."
              : (error ?? "Ce profil n'existe pas ou a été supprimé.")}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {isOwnBrokenProfile ? (
              <button
                type="button"
                onClick={() => {
                  sessionStorage.removeItem(REFRESH_KEY);
                  clearUser();
                  window.location.href = getOidcLoginUrl();
                }}
                className="inline-flex min-h-[40px] items-center justify-center rounded-eb bg-eb-primary px-4 text-[14px] font-medium text-white"
              >
                Réessayer
              </button>
            ) : (
              <Link
                to="/"
                className="inline-flex min-h-[40px] items-center justify-center rounded-eb border border-eb-layout px-4 text-[14px] font-medium text-eb-text"
              >
                Retour à l'accueil
              </Link>
            )}
          </div>
        </div>
      </main>
    );
  }

  // --- Page profil ---
  return (
    <main className="min-h-screen bg-eb-page">
      <div className="mx-auto max-w-[1200px] px-4 py-6 space-y-4">

        <Topbar currentSlug={slug} />

        <ProfileCard
          profile={profile}
          isOwner={isOwner}
          onProfileUpdated={(updated) =>
            setProfile((prev) => (prev ? { ...prev, ...updated } : prev))
          }
        />

        {/* Agenda : hauteur fixe, passe les missions pour colorier les slots */}
        <section className="rounded-eb-card border border-eb-layout bg-white p-4" style={{ height: "70vh" }}>
          <Agenda
            slug={slug}
            isOwner={isOwner}
            unavailabilities={unavailabilities}
            onUnavailabilitiesChange={setUnavailabilities}
            missions={missions}
          />
        </section>

        {/* Sections owner uniquement */}
        {isOwner && user?.token && (
          <>
            <MissionsSection
              slug={slug}
              token={user.token}
              onMissionsChange={setMissions}
            />

            <UnavailabilitySection
              slug={slug}
              token={user.token}
              unavailabilities={unavailabilities}
              onUnavailabilitiesChange={setUnavailabilities}
            />

            <FacturesSection
              slug={slug}
              token={user.token}
              missions={missions}
            />
          </>
        )}
      </div>
    </main>
  );
}
