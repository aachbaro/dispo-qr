// public/services/missions.ts

/**
 * Types partagés pour les missions
 */

// Payload qu’un client peut envoyer en créant une mission
export interface MissionPayload {
  etablissement: string;
  etablissement_address?: string;
  contact_name?: string;
  contact_email: string;
  contact_phone: string;
  instructions?: string;
  mode: "freelance" | "salarié";
  date_slot: string; // format ISO (datetime-local)
  end_slot: string; // format ISO (datetime-local)
}

// Mission complète telle qu’elle est stockée en base
export interface Mission extends MissionPayload {
  id: number;
  created_at: string;
  status:
    | "proposé"
    | "validé"
    | "réalisé"
    | "paiement_en_attente"
    | "payé"
    | "terminé"
    | "refusé";
  devis_url?: string;
  facture_url?: string;
  payment_link?: string;
}

// Type pour une mise à jour partielle
export type MissionUpdate = Partial<MissionPayload> & {
  status?: Mission["status"];
  devis_url?: string;
  facture_url?: string;
  payment_link?: string;
};

/**
 * Services API
 */

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("adminToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ➕ Créer une mission (côté client)
export async function createMission(
  payload: MissionPayload
): Promise<{ mission: Mission }> {
  const res = await fetch("/api/missions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error("❌ Erreur création mission");

  return res.json();
}

// 📜 Lister toutes les missions
export async function listMissions(): Promise<{ missions: Mission[] }> {
  const res = await fetch("/api/missions");
  if (!res.ok) throw new Error("❌ Erreur récupération missions");

  return res.json();
}

// ✏️ Mettre à jour une mission
export async function updateMission(
  id: number,
  updates: MissionUpdate
): Promise<{ mission: Mission }> {
  const res = await fetch(`/api/missions/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(updates),
  });

  if (!res.ok) throw new Error("❌ Erreur mise à jour mission");

  return res.json();
}
