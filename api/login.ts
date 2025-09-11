import type { VercelRequest, VercelResponse } from "@vercel/node";
import jwt from "jsonwebtoken";
import "dotenv/config";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { password } = req.body || {};
  console.log("ENV ADMIN_SECRET:", process.env.ADMIN_SECRET);
  console.log("Received password:", password);
  if (!password) return res.status(400).json({ error: "Password required" });

  if (password !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: "Invalid password" });
  }

  // Générer un JWT valide 1h
  const token = jwt.sign(
    { role: "admin" },
    process.env.JWT_SECRET!,
    { expiresIn: "1h" }
  );

  return res.status(200).json({ token });
}
