// src/services/factures.ts
// -------------------------------------------------------------
// Services liés aux factures d'une entreprise
//
// Fonctions disponibles :
// - listEntrepriseFactures(ref)              : lister les factures
// - createEntrepriseFacture(ref, payload)    : créer une facture
// - getEntrepriseFacture(ref, factureId)     : récupérer une facture
// - updateEntrepriseFacture(ref, factureId)  : mettre à jour une facture
// - deleteEntrepriseFacture(ref, factureId)  : supprimer une facture
// - generateFacturePaymentLink(ref, id)      : générer un lien de paiement Stripe
//
// ⚠️ Notes :
// - ref = slug (string) ou id (number) de l’entreprise
// - L’API applique les contrôles d’accès (JWT + RLS)
// -------------------------------------------------------------

import { request } from "./api";

// ----------------------
// Types
// ----------------------
export interface FacturePayload {
  numero: string;
  date_emission: string;

  // Infos client
  client_name: string;
  client_address_ligne1: string;
  client_address_ligne2?: string;
  client_ville: string;
  client_code_postal: string;
  client_pays?: string;

  // Contact
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;

  // Prestation
  description?: string;
  hours: number;
  rate: number;

  // Montants
  montant_ht: number;
  tva: number;
  montant_ttc: number;

  // Mentions
  mention_tva?: string;
  conditions_paiement?: string;
  penalites_retard?: string;

  // Lien mission
  mission_id?: number; // optionnel
}

export interface Facture extends FacturePayload {
  id: number;
  entreprise_id: number;
  created_at: string;

  // PDF généré
  url?: string;

  // Paiement Stripe
  payment_link?: string;
  stripe_session_id?: string;
  stripe_payment_intent?: string;
  status: "pending" | "pending_payment" | "paid" | "cancelled";
}

export type FactureUpdate = Partial<FacturePayload> & {
  payment_link?: string;
  stripe_session_id?: string;
  stripe_payment_intent?: string;
  status?: Facture["status"];
};

// ----------------------
// Services Factures
// ----------------------

/**
 * 📜 Lister les factures d’une entreprise
 */
export async function listEntrepriseFactures(
  ref: string | number
): Promise<{ factures: Facture[] }> {
  return request<{ factures: Facture[] }>(`/api/entreprises/${ref}/factures`);
}

/**
 * ➕ Créer une facture
 */
export async function createEntrepriseFacture(
  ref: string | number,
  payload: FacturePayload
): Promise<{ facture: Facture }> {
  return request<{ facture: Facture }>(`/api/entreprises/${ref}/factures`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * 🔍 Lire une facture
 */
export async function getEntrepriseFacture(
  ref: string | number,
  factureId: number
): Promise<{ facture: Facture }> {
  return request<{ facture: Facture }>(
    `/api/entreprises/${ref}/factures/${factureId}`
  );
}

/**
 * ✏️ Mettre à jour une facture
 */
export async function updateEntrepriseFacture(
  ref: string | number,
  factureId: number,
  updates: FactureUpdate
): Promise<{ facture: Facture }> {
  return request<{ facture: Facture }>(
    `/api/entreprises/${ref}/factures/${factureId}`,
    {
      method: "PUT",
      body: JSON.stringify(updates),
    }
  );
}

/**
 * ❌ Supprimer une facture
 */
export async function deleteEntrepriseFacture(
  ref: string | number,
  factureId: number
): Promise<void> {
  await request(`/api/entreprises/${ref}/factures/${factureId}`, {
    method: "DELETE",
  });
}

/**
 * 💳 Générer un lien de paiement Stripe pour une facture
 */
export async function generateFacturePaymentLink(
  ref: string | number,
  factureId: number
): Promise<{ url: string }> {
  return request<{ url: string }>(
    `/api/entreprises/${ref}/factures/${factureId}/payment-link`,
    { method: "POST" }
  );
}
