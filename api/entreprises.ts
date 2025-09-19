// api/entreprises.ts
import { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";

const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

// Vérif si admin/freelance (si on veut restreindre POST)
function verifyUser(req: VercelRequest): { valid: boolean; userId?: string } {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return { valid: false };

  try {
    const token = authHeader.replace("Bearer ", "").trim();
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    return { valid: true, userId: decoded.userId };
  } catch {
    return { valid: false };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("entreprise")
      .select(
        "id, nom, prenom, adresse, email, telephone, slug, siret, statut_juridique, tva_intracom, mention_tva, iban, bic, taux_horaire, devise, conditions_paiement, penalites_retard, created_at, updated_at"
      )
      .order("created_at", { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ entreprises: data ?? [] });
  }

  if (req.method === "POST") {
    const { valid, userId } = verifyUser(req);
    if (!valid || !userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const {
      nom,
      prenom,
      adresse,
      email,
      telephone,
      siret,
      statut_juridique,
      tva_intracom,
      mention_tva,
      iban,
      bic,
      taux_horaire,
      devise,
      conditions_paiement,
      penalites_retard,
      slug,
    } = req.body;

    if (!nom || !prenom || !adresse || !email || !siret || !iban || !bic) {
      return res.status(400).json({ error: "Champs obligatoires manquants" });
    }

    const { data, error } = await supabase
      .from("entreprise")
      .insert([
        {
          user_id: userId,
          nom,
          prenom,
          adresse,
          email,
          telephone,
          siret,
          statut_juridique,
          tva_intracom,
          mention_tva,
          iban,
          bic,
          taux_horaire,
          devise,
          conditions_paiement,
          penalites_retard,
          slug,
        },
      ])
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json({ entreprise: data });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
