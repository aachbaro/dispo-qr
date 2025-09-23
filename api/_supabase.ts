// api/_supabase.ts
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL ?? "";
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

if (!url) throw new Error("[supabaseAdmin] SUPABASE_URL manquant");
if (!serviceRole)
  throw new Error("[supabaseAdmin] SUPABASE_SERVICE_ROLE_KEY manquant");

// ✅ Client admin (v2)
export const supabaseAdmin = createClient(url, serviceRole, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
