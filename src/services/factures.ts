// src/services/factures.ts
// -------------------------------------------------------------
// Services liés aux factures d'une entreprise
//
// 📌 Description :
//   - CRUD des factures
//   - Chaque facture peut être liée à une mission (via mission_id)
//   - Les heures, le taux, le HT et TTC sont stockés en base pour générer le PDF
//
// 📍 Endpoints :
//   - GET    /api/entreprises/[ref]/factures
//   - POST   /api/entreprises/[ref]/factures
//   - GET    /api/entreprises/[ref]/factures/[id]
//   - PUT    /api/entreprises/[ref]/factures/[id]
//   - DELETE /api/entreprises/[ref]/factures/[id]
//   - POST   /api/entreprises/[ref]/factures/[id]/payment-link
//
// 🔒 Règles d’accès :
//   - Lecture publique (slug) / owner (id)
//   - CRUD limité aux entreprises propriétaires
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

  // Détails temps & tarifs
  hours: number; // durée en heures
  rate: number; // taux horaire appliqué

  // Montants
  montant_ht: number;
  tva: number; // en pourcentage
  montant_ttc: number;

  // Mentions
  mention_tva?: string;
  conditions_paiement?: string;
  penalites_retard?: string;

  // Lien mission
  mission_id?: number;
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
export async function listEntrepriseFactures(
  ref: string | number
): Promise<{ factures: Facture[] }> {
  return request<{ factures: Facture[] }>(`/api/entreprises/${ref}/factures`);
}

export async function createEntrepriseFacture(
  ref: string | number,
  payload: FacturePayload
): Promise<{ facture: Facture }> {
  return request<{ facture: Facture }>(`/api/entreprises/${ref}/factures`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getEntrepriseFacture(
  ref: string | number,
  factureId: number
): Promise<{ facture: Facture }> {
  return request<{ facture: Facture }>(
    `/api/entreprises/${ref}/factures/${factureId}`
  );
}

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

export async function deleteEntrepriseFacture(
  ref: string | number,
  factureId: number
): Promise<void> {
  await request(`/api/entreprises/${ref}/factures/${factureId}`, {
    method: "DELETE",
  });
}

export async function generateFacturePaymentLink(
  ref: string | number,
  factureId: number
): Promise<{ url: string }> {
  return request<{ url: string }>(
    `/api/entreprises/${ref}/factures/${factureId}/payment-link`,
    { method: "POST" }
  );
}
