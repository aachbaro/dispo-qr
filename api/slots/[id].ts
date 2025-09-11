// api/slots/[id].ts
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
  } catch (err) {
    return false;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: "Missing slot id" });

  if (!verifyAdmin(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method === "PATCH") {
    const updates = req.body;
    const { data, error } = await supabase
      .from("slots")
      .update(updates)
      .eq("id", id)
      .select();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ slot: data[0] });
  }

  if (req.method === "DELETE") {
    const { error } = await supabase.from("slots").delete().eq("id", id);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: "Method Not Allowed" });
}
