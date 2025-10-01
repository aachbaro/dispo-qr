// api/_supabase.ts
// -------------------------------------------------------------
// Client Supabase (admin)
// -------------------------------------------------------------
//
// 📌 Description :
//   - Initialise un client Supabase avec la clé service role
//   - Utilisé dans toutes les routes API (auth, entreprises, etc.)
//
// ⚠️ Attention :
//   - Ne jamais exposer la clé SERVICE_ROLE côté frontend
//   - PersistSession et autoRefreshToken désactivés (mode backend)
// -------------------------------------------------------------

import { createClient } from "@supabase/supabase-js";

// ----------------------
// Env vars
// ----------------------
const url = process.env.SUPABASE_URL ?? "";
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

if (!url) throw new Error("❌ [supabaseAdmin] SUPABASE_URL manquant");
if (!serviceRole) {
  throw new Error("❌ [supabaseAdmin] SUPABASE_SERVICE_ROLE_KEY manquant");
}

// ----------------------
// Client admin
// ----------------------
export const supabaseAdmin = createClient(url, serviceRole, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
