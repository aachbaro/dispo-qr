// api/_supabase.ts

import { createClient } from "@supabase/supabase-js";

// Client admin (serveur) — utilise la SERVICE_ROLE_KEY
// ⚠️ Ne jamais importer ce fichier dans le frontend
const url = process.env.SUPABASE_URL as string | undefined;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined;

if (!url) throw new Error("[supabaseAdmin] SUPABASE_URL manquant (Vercel env)");
if (!serviceRole)
  throw new Error(
    "[supabaseAdmin] SUPABASE_SERVICE_ROLE_KEY manquant (Vercel env)"
  );

export const supabaseAdmin = createClient(url, serviceRole);
