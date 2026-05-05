import { Link, Navigate } from "react-router-dom";

import Topbar from "../components/Topbar";
import { useUserContext } from "../context/UserContext";

export default function ClientDashboardPage() {
  const { user } = useUserContext();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "client") {
    return <Navigate to="/profile" replace />;
  }

  return (
    <main className="min-h-screen bg-eb-page">
      <div className="mx-auto max-w-[1100px] px-4 py-6 space-y-4">
        <Topbar />

        <section className="rounded-eb-card border border-eb-layout bg-white p-6">
          <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-eb-muted">
            Espace client
          </p>
          <h1 className="mt-3 text-[28px] font-semibold text-eb-text">
            Bonjour {user.display_name}
          </h1>
          <p className="mt-3 max-w-2xl text-[14px] leading-6 text-eb-secondary">
            La migration du parcours client est lancee. Cette page sera la base pour les contacts,
            les templates de mission et le suivi des propositions.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-eb-card border border-eb-layout bg-white p-5">
            <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-eb-muted">
              Contacts
            </p>
            <p className="mt-3 text-[14px] leading-6 text-eb-secondary">
              Les contacts favoris du client n'ont pas encore ete remigres dans la v2.
            </p>
          </div>

          <div className="rounded-eb-card border border-eb-layout bg-white p-5">
            <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-eb-muted">
              Templates
            </p>
            <p className="mt-3 text-[14px] leading-6 text-eb-secondary">
              Les modeles de mission seront le prochain vrai bloc du parcours client.
            </p>
          </div>

          <div className="rounded-eb-card border border-eb-layout bg-white p-5">
            <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-eb-muted">
              Missions
            </p>
            <p className="mt-3 text-[14px] leading-6 text-eb-secondary">
              La proposition publique et le suivi client restent a remonter depuis le legacy.
            </p>
          </div>
        </section>

        {user.slug ? (
          <section className="rounded-eb-card border border-eb-layout bg-white p-5">
            <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-eb-muted">
              Liens utiles
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              <Link
                to={`/p/${user.slug}`}
                className="eb-focus-ring inline-flex min-h-[40px] items-center justify-center rounded-eb border border-eb-layout px-4 text-[14px] font-medium text-eb-text"
              >
                Voir mon profil technique
              </Link>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
