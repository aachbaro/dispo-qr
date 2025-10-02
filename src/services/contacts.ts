// src/services/contacts.ts
// -------------------------------------------------------------
// Services liés aux contacts client (client_contacts)
// -------------------------------------------------------------
//
// 📌 Fonctions :
//   - listContacts()            → liste des extras ajoutés par le client
//   - addContact(entrepriseId)  → ajoute un extra à la liste (si pas déjà présent)
//   - removeContact(contactId)  → supprime un extra
//
// 🔒 Règles d’accès :
//   - Seul le client connecté peut gérer ses contacts
//   - Auth requise (token JWT envoyé par request())
// -------------------------------------------------------------

import { request } from "./api";
import type { Tables } from "../../types/database";

// ----------------------
// Types
// ----------------------
export type ClientContact = Tables<"client_contacts"> & {
  entreprise?: Tables<"entreprise">;
};

// Réponse possible de l’API addContact
type AddContactResponse = { contact: ClientContact } | { message: string };

// ----------------------
// Services
// ----------------------

/**
 * 📋 Liste les contacts du client connecté
 */
export async function listContacts(): Promise<{ contacts: ClientContact[] }> {
  return request<{ contacts: ClientContact[] }>("/api/clients/contacts");
}

/**
 * ➕ Ajoute un extra (entreprise) à la liste des contacts
 */
export async function addContact(
  entrepriseId: number
): Promise<AddContactResponse> {
  return request<AddContactResponse>("/api/clients/contacts", {
    method: "POST",
    body: JSON.stringify({ entreprise_id: entrepriseId }),
  });
}

/**
 * ❌ Supprime un extra de la liste des contacts
 */
export async function removeContact(
  contactId: number
): Promise<{ success: true }> {
  return request<{ success: true }>(`/api/clients/contacts/${contactId}`, {
    method: "DELETE",
  });
}
