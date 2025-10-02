// api/_lib/entreprise.ts
// -------------------------------------------------------------
// Helpers liés aux entreprises (API)
// -------------------------------------------------------------
//
// 📌 Fonctions utilitaires :
//   - getUserFromToken(req) → récupère l’utilisateur connecté via JWT
//   - findEntreprise(ref)   → retrouve une entreprise par id, slug ou user_id
//   - canAccessSensitive()  → vérifie si un user peut accéder aux infos sensibles
//
// 🔒 Règles d’accès :
//   - Auth requise pour accéder aux données sensibles
//   - Public → accès en lecture via slug uniquement
//
// ⚠️ Remarques :
//   - Centralisé pour éviter la duplication dans chaque route
//   - Typage basé sur types/database.ts généré par Supabase
// -------------------------------------------------------------

import type { VercelRequest } from "@vercel/node";
import { supabaseAdmin } from "../_supabase.js";
import type { Tables } from "../../types/database.js";

// ----------------------
// 🏢 Entreprise helpers
// ----------------------
export async function findEntreprise(ref: string | number) {
  let query = supabaseAdmin.from("entreprise").select("*");

  if (typeof ref === "number" || !isNaN(Number(ref))) {
    // Recherche par id numérique
    query = query.eq("id", Number(ref));
  } else if (typeof ref === "string" && /^[0-9a-fA-F-]{36}$/.test(ref)) {
    // Recherche par user_id (UUID)
    query = query.eq("user_id", ref);
  } else {
    // Recherche par slug
    query = query.eq("slug", ref);
  }

  return query.single<Tables<"entreprise">>();
}

// ----------------------
// 🔒 Permissions
// ----------------------
export function canAccessSensitive(
  user: any,
  entreprise: Tables<"entreprise">
): boolean {
  if (!user) return false;
  if (user.id === entreprise.user_id) return true;
  if (user.app_metadata?.role === "admin") return true;
  return false;
}
