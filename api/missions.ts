// api/missions.ts
import { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";

const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

function verifyAdmin(req: VercelRequest): boolean {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return false;
  const token = authHeader.replace("Bearer ", "").trim();
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    return (decoded as any).role === "admin";
  } catch {
    return false;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("missions")
      .select(
        "id, created_at, date_slot, etablissement, contact, instructions, mode, status, devis_url, facture_url, payment_link"
      )
      .order("created_at", { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ missions: data ?? [] });
  }

  if (req.method === "POST") {
    // ❌ pas besoin d'être admin → un client peut proposer une mission
    const { etablissement, contact, instructions, mode, date_slot } = req.body;
    if (!etablissement || !contact || !date_slot || !mode) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const { data, error } = await supabase
      .from("missions")
      .insert([
        {
          etablissement,
          contact,
          instructions,
          mode,
          date_slot,
          status: "proposé",
        },
      ])
      .select();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ mission: data?.[0] });
  }

  return res.status(405).json({ error: "Method Not Allowed" });
}
