// src/services/entreprises.ts

/**
 * ----------------------
 * Types
 * ----------------------
 */
export interface Entreprise {
  id: number;
  user_id?: string; // lié au propriétaire
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

/**
 * ----------------------
 * Utils
 * ----------------------
 */
function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("adminToken");

  if (!token) {
    console.warn("⚠️ Aucun adminToken trouvé dans localStorage");
    return {};
  }

  return { Authorization: `Bearer ${token}` };
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    "Content-Type": "application/json",
    ...getAuthHeaders(),
    ...(options.headers || {}),
  };

  console.log("🌍 Fetch:", url, options.method || "GET", { headers });

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("❌ API error:", res.status, err);
    throw new Error(err.error || res.statusText);
  }

  return res.json();
}

/**
 * ----------------------
 * Services Entreprise
 * ----------------------
 */

// 📜 Liste publique des entreprises
export async function listEntreprises(): Promise<{ data: Entreprise[] }> {
  return request<{ data: Entreprise[] }>("/api/entreprises");
}

// ➕ Créer une entreprise (réservé à un utilisateur connecté)
export async function createEntreprise(
  payload: Omit<Entreprise, "id" | "created_at" | "updated_at" | "user_id">
): Promise<{ data: Entreprise }> {
  return request<{ data: Entreprise }>("/api/entreprises", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// 🔍 Récupérer une entreprise par son slug
export async function getEntrepriseBySlug(
  slug: string
): Promise<{ data: Entreprise }> {
  return request<{ data: Entreprise }>(`/api/entreprises/${slug}`);
}

// ✏️ Mettre à jour une entreprise (réservé à l’owner)
export async function updateEntreprise(
  slug: string,
  updates: Partial<Omit<Entreprise, "id" | "slug" | "created_at">>
): Promise<{ data: Entreprise }> {
  console.log("✏️ Mise à jour entreprise:", slug, updates);

  return request<{ data: Entreprise }>(`/api/entreprises/${slug}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
}
