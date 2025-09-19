// src/services/entreprises.ts

export interface Entreprise {
  id: number;
  nom: string;
  prenom: string;
  adresse: string;
  email: string;
  telephone?: string;
  siret: string;
  statut_juridique: string;
  tva_intracom?: string;
  mention_tva: string;
  iban: string;
  bic: string;
  taux_horaire: number;
  devise: string;
  conditions_paiement: string;
  penalites_retard: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

// Utilitaire
async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

// Liste des entreprises (public)
export async function listEntreprises() {
  return request<{ data: any[] }>("/api/entreprises");
}

// Créer une entreprise (freelance/admin connecté)
export async function createEntreprise(
  payload: Omit<Entreprise, "id" | "created_at" | "updated_at">
): Promise<{ entreprise: Entreprise }> {
  const token = localStorage.getItem("adminToken");
  return request("/api/entreprises", {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: JSON.stringify(payload),
  });
}

export async function getEntrepriseBySlug(slug: string) {
  return request<{ data: any }>(`/api/entreprises/${slug}`);
}
