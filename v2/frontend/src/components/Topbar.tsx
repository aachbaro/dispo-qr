/**
 * src/components/Topbar.tsx
 * Layer  : Frontend — composant UI partagé
 * Role   : Barre de navigation commune à toutes les pages authentifiées.
 *          Affiche le logo, le nom de l'utilisateur connecté, un lien
 *          "Mon profil" si on n'est pas sur sa propre page, et le bouton
 *          de déconnexion.
 * Deps   : UserContext, api (getOidcLogoutUrl)
 */

import { Link } from "react-router-dom";
import { getOidcLogoutUrl } from "../api";
import { useUserContext } from "../context/UserContext";

interface Props {
  /** Slug de la page courante — masque le lien "Mon profil" si identique */
  currentSlug?: string;
}

export default function Topbar({ currentSlug }: Props) {
  const { user, clearUser } = useUserContext();

  function handleLogout() {
    clearUser();
    window.location.href = getOidcLogoutUrl(`${window.location.origin}/login`);
  }

  return (
    <div className="flex items-center justify-between">
      <Link to="/" className="font-logo text-[24px] leading-none text-eb-text select-none">
        ExtraBeam
      </Link>

      <div className="flex items-center gap-3">
        {user && (
          <>
            <span className="hidden text-[13px] text-eb-secondary sm:block">
              {user.display_name} · {user.role}
            </span>
            {user.role === "admin" && (
              <Link to="/admin" className="eb-btn-ghost text-[13px]">
                Admin
              </Link>
            )}
            {user.role === "client" ? (
              <Link to="/client" className="eb-btn-ghost text-[13px]">
                Mon espace
              </Link>
            ) : (
              user.slug && user.slug !== currentSlug && (
                <Link to={`/p/${user.slug}`} className="eb-btn-ghost text-[13px]">
                  Mon profil
                </Link>
              )
            )}
          </>
        )}
        <button type="button" onClick={handleLogout} className="eb-btn-ghost text-[13px]">
          Se déconnecter
        </button>
      </div>
    </div>
  );
}
