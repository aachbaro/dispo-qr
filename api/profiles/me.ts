// api/profiles/me.ts
// -------------------------------------------------------------
// Gestion du profil utilisateur connecté
// -------------------------------------------------------------
//
// 📌 Description :
//   - GET : Récupère le profil complet connecté (via getUserFromToken)
//   - PUT : Met à jour ou crée le profil + ressource associée
//            • freelance → crée entreprise liée (slug unique)
//            • client → crée entrée dans clients
//
// ⚙️ Logique :
//   - Source unique de vérité = table `profiles`
//   - Ne dépend pas des user_metadata Supabase
//   - Crée les ressources manquantes automatiquement
// -------------------------------------------------------------

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../_supabase.js";
import type { Tables, TablesInsert } from "../../types/database.js";
import { getUserFromToken } from "../utils/auth.js";

type Profile = Tables<"profiles">;
type Entreprise = Tables<"entreprise">;
type Client = Tables<"clients">;

// ----------------------
// Helper : génération de slug unique
// ----------------------
async function generateUniqueSlug(firstName: string, lastName: string) {
  const base = `${firstName}-${lastName}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

  let slug = base;
  let i = 1;

  while (true) {
    const { data, error } = await supabaseAdmin
      .from("entreprise")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (error) throw new Error("Erreur vérification slug");
    if (!data) break;
    slug = `${base}-${i++}`;
  }

  return slug;
}

// ----------------------
// Handler principal
// ----------------------
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ error: "❌ Non authentifié" });
    }

    // ============================================================
    // GET → Lire le profil complet
    // ============================================================
    if (req.method === "GET") {
      const { data: profile, error } = await supabaseAdmin
        .from("profiles")
        .select("id, email, role, first_name, last_name, phone, created_at")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error("❌ Erreur fetch profil:", error.message);
        return res.status(500).json({ error: error.message });
      }

      // 🏢 Ajoute slug entreprise si freelance
      let slug = null;
      if (profile?.role === "freelance") {
        const { data: entreprise } = await supabaseAdmin
          .from("entreprise")
          .select("slug")
          .eq("user_id", user.id)
          .maybeSingle();
        slug = entreprise?.slug ?? null;
      }

      return res.status(200).json({
        profile: {
          id: user.id,
          email: user.email,
          role: profile?.role ?? null,
          first_name: profile?.first_name ?? null,
          last_name: profile?.last_name ?? null,
          phone: profile?.phone ?? null,
          slug,
          created_at: profile?.created_at ?? null,
        },
      });
    }

    // ============================================================
    // PUT → Créer / Mettre à jour le profil + ressources liées
    // ============================================================
    if (req.method === "PUT") {
      const { role, first_name, last_name, phone } = req.body || {};
      if (!role) {
        return res.status(400).json({ error: "Champ 'role' obligatoire" });
      }

      // 🔍 Vérifie si le profil existe
      const { data: existingProfile } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      // 🧱 Insère ou met à jour
      const profileData: Partial<Profile> = {
        id: user.id,
        email: user.email,
        role,
        first_name,
        last_name,
        phone,
      };

      if (!existingProfile) {
        const { error: insertError } = await supabaseAdmin
          .from("profiles")
          .insert([profileData]);
        if (insertError) {
          console.error("❌ Erreur création profil:", insertError.message);
          return res.status(500).json({ error: insertError.message });
        }
        console.log("🆕 Profil créé pour:", user.email);
      } else {
        const { error: updateError } = await supabaseAdmin
          .from("profiles")
          .update(profileData)
          .eq("id", user.id);
        if (updateError) {
          console.error("❌ Erreur update profil:", updateError.message);
          return res.status(500).json({ error: updateError.message });
        }
      }

      // 🏢 Si FREELANCE → crée entreprise si manquante
      if (role === "freelance") {
        const { data: existingEnt } = await supabaseAdmin
          .from("entreprise")
          .select("id, slug")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!existingEnt) {
          const slug = await generateUniqueSlug(
            first_name || "extra",
            last_name || "user"
          );

          const entrepriseData: TablesInsert<"entreprise"> = {
            user_id: user.id,
            prenom: first_name || "",
            nom: last_name || "",
            email: user.email,
            slug,
            adresse_ligne1: "à compléter",
            siret: "",
            iban: "",
            bic: "",
          };

          const { error: entError } = await supabaseAdmin
            .from("entreprise")
            .insert([entrepriseData]);

          if (entError) {
            console.error("⚠️ Erreur création entreprise:", entError.message);
          } else {
            console.log("🏢 Entreprise créée automatiquement:", slug);
          }
        }
      }

      // 👤 Si CLIENT → crée client si manquant
      if (role === "client") {
        const { data: existingClient } = await supabaseAdmin
          .from("clients")
          .select("id")
          .eq("id", user.id)
          .maybeSingle();

        if (!existingClient) {
          const clientData: TablesInsert<"clients"> = {
            id: user.id,
            role: "client",
          };

          const { error: insertClientError } = await supabaseAdmin
            .from("clients")
            .insert([clientData]);

          if (insertClientError) {
            console.error(
              "⚠️ Erreur création client:",
              insertClientError.message
            );
          } else {
            console.log("👤 Client créé automatiquement pour:", user.email);
          }
        }
      }

      return res.status(200).json({ profile: profileData });
    }

    // ============================================================
    // Méthode non autorisée
    // ============================================================
    return res.status(405).json({ error: "Méthode non autorisée" });
  } catch (err: any) {
    console.error("❌ Exception profil/me:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}
