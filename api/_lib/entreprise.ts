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
    // Recherche par ID numérique
    query = query.eq("id", Number(ref));
  } else if (typeof ref === "string") {
    // UUID → recherche par user_id
    if (/^[0-9a-fA-F-]{8}-[0-9a-fA-F-]{4}-/.test(ref)) {
      query = query.eq("user_id", ref);
    } else {
      // Slug (ex: "adam-achbarou")
      query = query.eq("slug", ref);
    }
  }

  return query.single<Tables<"entreprise">>();
}

// ----------------------
// 🔒 Permissions
// ----------------------
export function canAccessSensitive(
  user: { id: string; role?: string | null } | null,
  entreprise: Tables<"entreprise">
): boolean {
  console.log(
    "🔒 Vérification accès sensible pour user:",
    user,
    "et entreprise:",
    entreprise
  );
  if (!user || !entreprise) return false;

  // 👇 Le propriétaire (freelance) de l'entreprise
  if (entreprise.user_id === user.id) return true;

  // 👇 Les admins ont toujours accès
  if (user.role === "admin") return true;

  return false;
}
