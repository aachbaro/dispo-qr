// api/_supabase.ts
// -------------------------------------------------------------
// Clients Supabase (admin + public)
// -------------------------------------------------------------
//
// 📌 Description :
//   - Initialise deux clients Supabase :
//       1️⃣ supabaseAdmin  → avec la clé SERVICE_ROLE_KEY (accès total DB)
//       2️⃣ supabasePublic → avec la clé ANON_KEY (pour vérif JWT Auth)
//   - Utilisés respectivement :
//       - supabaseAdmin : toutes les opérations serveur sur les tables
//       - supabasePublic : vérification des tokens via getUserFromToken()
//
// ⚠️ Attention :
//   - Ne jamais exposer la clé SERVICE_ROLE côté frontend
//   - PersistSession et autoRefreshToken désactivés (mode backend)
// -------------------------------------------------------------

import { createClient } from "@supabase/supabase-js";

// ----------------------
// 🔧 Variables d'environnement
// ----------------------
const url = process.env.SUPABASE_URL ?? "";
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const anonKey = process.env.SUPABASE_ANON_KEY ?? "";

if (!url) throw new Error("❌ [supabase] SUPABASE_URL manquant");
if (!serviceRole)
  throw new Error("❌ [supabase] SUPABASE_SERVICE_ROLE_KEY manquant");
if (!anonKey)
  console.warn(
    "⚠️ [supabase] SUPABASE_ANON_KEY manquant — vérif JWT impossible"
  );

// ----------------------
// 🧠 Client admin → accès total (serveur uniquement)
// ----------------------
export const supabaseAdmin = createClient(url, serviceRole, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// ----------------------
// 👤 Client public → vérification des tokens JWT
// ----------------------
export const supabasePublic = createClient(url, anonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
