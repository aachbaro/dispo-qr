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
    // 🔒 Les missions peuvent être listées sans admin (mais à filtrer si tu veux)
    const { data, error } = await supabase
      .from("missions")
      .select(
        `
        id,
        created_at,
        date_slot,
        end_slot,
        etablissement,
        etablissement_address,
        contact_name,
        contact_email,
        contact_phone,
        instructions,
        mode,
        status,
        devis_url,
        facture_url,
        payment_link
      `
      )
      .order("created_at", { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ missions: data ?? [] });
  }

  if (req.method === "POST") {
    // Un client peut proposer une mission
    const {
      etablissement,
      etablissement_address,
      contact_name,
      contact_email,
      contact_phone,
      instructions,
      mode,
      date_slot,
      end_slot,
    } = req.body;

    if (
      !etablissement ||
      !contact_email ||
      !contact_phone ||
      !date_slot ||
      !mode
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const { data, error } = await supabase
      .from("missions")
      .insert([
        {
          etablissement,
          etablissement_address,
          contact_name,
          contact_email,
          contact_phone,
          instructions,
          mode,
          date_slot,
          end_slot,
          status: "proposé",
        },
      ])
      .select();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ mission: data?.[0] });
  }

  return res.status(405).json({ error: "Method Not Allowed" });
}
