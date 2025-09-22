// src/services/supabase.ts

import { createClient } from "@supabase/supabase-js";

// Client public (navigateur) — utilise la clé ANON
// ⚠️ Variables doivent commencer par VITE_
const url = import.meta.env.VITE_SUPABASE_URL as string;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!url) throw new Error("[supabase] VITE_SUPABASE_URL manquant");
if (!anon) throw new Error("[supabase] VITE_SUPABASE_ANON_KEY manquant");

export const supabase = createClient(url, anon);
