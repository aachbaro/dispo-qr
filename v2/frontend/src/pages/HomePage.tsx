import { Link } from "react-router-dom";

import { useUserContext } from "../context/UserContext";

function getPrimaryCta(userSlug?: string | null, userRole?: string | null) {
  if (!userRole) {
    return {
      href: "/login",
      label: "Se connecter",
    };
  }

  if (userRole === "client") {
    return {
      href: "/client",
      label: "Ouvrir mon espace",
    };
  }

  if (userRole === "admin") {
    return {
      href: "/admin",
      label: "Ouvrir l'admin",
    };
  }

  return {
    href: userSlug ? `/p/${userSlug}` : "/profile",
    label: "Voir mon profil",
  };
}

const featureCards = [
  {
    title: "Profil public soigné",
    description: "Montre ton univers, tes experiences et tes infos pro dans une page partageable.",
  },
  {
    title: "Agenda vivant",
    description: "Disponibilites, indisponibilites et missions restent lisibles au meme endroit.",
  },
  {
    title: "Facturation simple",
    description: "Prepare tes factures et centralise les infos utiles sans sortir de l'app.",
  },
];

export default function HomePage() {
  const { user } = useUserContext();
  const primaryCta = getPrimaryCta(user?.slug, user?.role);

  return (
    <main className="min-h-screen bg-eb-page text-eb-text">
      <div className="mx-auto flex min-h-screen w-full max-w-[1200px] flex-col px-4 py-6 md:px-6 lg:px-8">
        <header className="flex items-center justify-between">
          <Link to="/" className="font-logo text-[24px] leading-none text-eb-text select-none">
            ExtraBeam
          </Link>

          <div className="flex items-center gap-3">
            {!user && (
              <Link to="/register" className="eb-btn-ghost text-[13px]">
                Creer un compte
              </Link>
            )}
            <Link to={primaryCta.href} className="eb-btn-ghost text-[13px]">
              {primaryCta.label}
            </Link>
          </div>
        </header>

        <section className="grid flex-1 items-center gap-6 py-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] lg:py-12">
          <div className="relative overflow-hidden rounded-eb-card border border-eb-layout bg-eb-panel px-6 py-8 text-white md:px-8 md:py-10">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-90"
              style={{
                background:
                  "radial-gradient(circle at top right, rgba(59,130,246,0.22) 0%, rgba(59,130,246,0.1) 20%, rgba(17,24,39,0) 50%), radial-gradient(circle at bottom left, rgba(16,185,129,0.16) 0%, rgba(16,185,129,0.05) 22%, rgba(17,24,39,0) 46%)"
              }}
            />

            <div className="relative z-10 max-w-[620px]">
              <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-white/70">
                Freelance restauration et missions terrain
              </p>
              <h1 className="mt-4 text-[34px] font-light leading-[1.08] md:text-[48px]">
                Une page pro qui donne envie de te booker.
              </h1>
              <p className="mt-5 max-w-[520px] text-[15px] leading-7 text-white/82">
                ExtraBeam rassemble ton profil public, ton agenda et ta gestion quotidienne pour que ton activite paraisse nette, serieuse et facile a comprendre.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to={primaryCta.href}
                  className="eb-focus-ring inline-flex min-h-[44px] items-center justify-center rounded-eb bg-white px-5 text-[14px] font-medium text-eb-panel"
                >
                  {primaryCta.label}
                </Link>
                {!user && (
                  <Link
                    to="/register"
                    className="eb-focus-ring inline-flex min-h-[44px] items-center justify-center rounded-eb border border-white/20 px-5 text-[14px] font-medium text-white"
                  >
                    Demarrer gratuitement
                  </Link>
                )}
              </div>

              <div className="mt-10 grid gap-3 md:grid-cols-3">
                {featureCards.map((card) => (
                  <article key={card.title} className="rounded-eb border border-white/10 bg-white/6 p-4 backdrop-blur-sm">
                    <p className="text-[14px] font-medium text-white">{card.title}</p>
                    <p className="mt-2 text-[13px] leading-6 text-white/76">{card.description}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>

          <aside className="space-y-4">
            <section className="rounded-eb-card border border-eb-layout bg-white p-6">
              <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-eb-muted">
                Ce que tu peux montrer
              </p>
              <div className="mt-4 space-y-4">
                <div className="rounded-eb border border-eb-layout bg-eb-page px-4 py-3">
                  <p className="text-[14px] font-medium text-eb-text">Experience et positionnement</p>
                  <p className="mt-1 text-[13px] leading-6 text-eb-secondary">
                    Mets en avant tes passages en restauration, evenementiel ou production avec une lecture claire.
                  </p>
                </div>
                <div className="rounded-eb border border-eb-layout bg-eb-page px-4 py-3">
                  <p className="text-[14px] font-medium text-eb-text">Disponibilites a jour</p>
                  <p className="mt-1 text-[13px] leading-6 text-eb-secondary">
                    Un client peut comprendre rapidement quand tu es dispo sans te relancer partout.
                  </p>
                </div>
                <div className="rounded-eb border border-eb-layout bg-eb-page px-4 py-3">
                  <p className="text-[14px] font-medium text-eb-text">Infos administratives propres</p>
                  <p className="mt-1 text-[13px] leading-6 text-eb-secondary">
                    SIRET, coordonnees et bases de facturation restent accessibles dans ton espace detenteur.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-eb-card border border-eb-layout bg-white p-6">
              <p className="text-[18px] font-semibold text-eb-text">Navigation rapide</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  to={primaryCta.href}
                  className="eb-focus-ring inline-flex min-h-[42px] items-center justify-center rounded-eb bg-eb-primary px-4 text-[14px] font-medium text-white"
                >
                  {primaryCta.label}
                </Link>
                <Link
                  to="/login"
                  className="eb-focus-ring inline-flex min-h-[42px] items-center justify-center rounded-eb border border-eb-layout px-4 text-[14px] font-medium text-eb-text"
                >
                  Connexion
                </Link>
              </div>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}
