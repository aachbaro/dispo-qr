// src/types/aliases.ts
// -------------------------------------------------------------
// Alias génériques pour les types Supabase
// -------------------------------------------------------------
//
// 📌 Description :
//   Fournit des raccourcis typés universels pour accéder
//   aux lignes, insertions et mises à jour des tables Supabase.
//   À importer dans tous les modules du backend.
//
// -------------------------------------------------------------

import type { Database } from './database'

export type Table<Name extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][Name]['Row']

export type Insert<Name extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][Name]['Insert']

export type Update<Name extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][Name]['Update']

export type Enum<Name extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][Name]
