// api/_lib/utils/email.ts
// -------------------------------------------------------------
// Helper : retourne la meilleure adresse e-mail à utiliser
// -------------------------------------------------------------
import type { Tables } from "../../../types/database.js";

export function getClientEmailFromMission(
  mission: Partial<Tables<"missions">> & { client?: any }
): string | null {
  // Priorité : profil lié (si présent)
  if (mission.client?.email) return mission.client.email;
  // Fallback : contact_email directement dans la mission
  if (mission.contact_email) return mission.contact_email;
  return null;
}

export function getClientEmailFromFacture(
  facture: Partial<Tables<"factures">> & {
    missions?: Partial<Tables<"missions">> & { client?: any };
  }
): string | null {
  if (facture.missions?.client?.email) return facture.missions.client.email;
  if (facture.missions?.contact_email) return facture.missions.contact_email;
  if (facture.contact_email) return facture.contact_email;
  return null;
}
