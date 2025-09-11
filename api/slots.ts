// api/slots.ts
import { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";

const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

// helper pour vérifier le JWT
function verifyAdmin(req: VercelRequest): boolean {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return false;

  const token = authHeader.replace("Bearer ", "").trim();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    return (decoded as any).role === "admin";
  } catch (err) {
    return false;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("slots")
      .select("*")
      .order("start", { ascending: true });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ slots: data });
  }

  if (req.method === "POST") {
    if (!verifyAdmin(req)) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { start, end, title } = req.body;
    if (!start || !end || !title) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const { data, error } = await supabase
      .from("slots")
      .insert([{ start, end, title }])
      .select();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ slot: data[0] });
  }

  return res.status(405).json({ error: "Method Not Allowed" });
}
