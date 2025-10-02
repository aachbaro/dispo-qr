export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      client_contacts: {
        Row: {
          client_id: string
          created_at: string | null
          entreprise_id: number
          id: number
        }
        Insert: {
          client_id: string
          created_at?: string | null
          entreprise_id: number
          id?: never
        }
        Update: {
          client_id?: string
          created_at?: string | null
          entreprise_id?: number
          id?: never
        }
        Relationships: [
          {
            foreignKeyName: "client_contacts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_contacts_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprise"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          created_at: string | null
          id: string
          role: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          role?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string | null
        }
        Relationships: []
      }
      entreprise: {
        Row: {
          adresse_ligne1: string
          adresse_ligne2: string | null
          bic: string
          code_postal: string | null
          conditions_paiement: string
          created_at: string
          devise: string
          email: string
          iban: string
          id: number
          mention_tva: string
          nom: string
          pays: string | null
          penalites_retard: string
          prenom: string
          siret: string
          slug: string | null
          statut_juridique: string
          stripe_account_id: string | null
          taux_horaire: number
          telephone: string | null
          tva_intracom: string | null
          updated_at: string
          user_id: string | null
          ville: string | null
        }
        Insert: {
          adresse_ligne1: string
          adresse_ligne2?: string | null
          bic: string
          code_postal?: string | null
          conditions_paiement?: string
          created_at?: string
          devise?: string
          email: string
          iban: string
          id?: number
          mention_tva?: string
          nom: string
          pays?: string | null
          penalites_retard?: string
          prenom: string
          siret: string
          slug?: string | null
          statut_juridique?: string
          stripe_account_id?: string | null
          taux_horaire?: number
          telephone?: string | null
          tva_intracom?: string | null
          updated_at?: string
          user_id?: string | null
          ville?: string | null
        }
        Update: {
          adresse_ligne1?: string
          adresse_ligne2?: string | null
          bic?: string
          code_postal?: string | null
          conditions_paiement?: string
          created_at?: string
          devise?: string
          email?: string
          iban?: string
          id?: number
          mention_tva?: string
          nom?: string
          pays?: string | null
          penalites_retard?: string
          prenom?: string
          siret?: string
          slug?: string | null
          statut_juridique?: string
          stripe_account_id?: string | null
          taux_horaire?: number
          telephone?: string | null
          tva_intracom?: string | null
          updated_at?: string
          user_id?: string | null
          ville?: string | null
        }
        Relationships: []
      }
      factures: {
        Row: {
          client_address_ligne1: string | null
          client_address_ligne2: string | null
          client_code_postal: string | null
          client_name: string
          client_pays: string | null
          client_ville: string | null
          conditions_paiement: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string | null
          date_emission: string
          description: string | null
          entreprise_id: number
          hours: number | null
          id: number
          mention_tva: string | null
          mission_id: number | null
          montant_ht: number
          montant_ttc: number
          numero: string
          payment_link: string | null
          penalites_retard: string | null
          rate: number | null
          status: Database["public"]["Enums"]["facture_status"] | null
          stripe_payment_intent: string | null
          stripe_session_id: string | null
          tva: number | null
          url: string | null
        }
        Insert: {
          client_address_ligne1?: string | null
          client_address_ligne2?: string | null
          client_code_postal?: string | null
          client_name: string
          client_pays?: string | null
          client_ville?: string | null
          conditions_paiement?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          date_emission?: string
          description?: string | null
          entreprise_id: number
          hours?: number | null
          id?: number
          mention_tva?: string | null
          mission_id?: number | null
          montant_ht: number
          montant_ttc: number
          numero: string
          payment_link?: string | null
          penalites_retard?: string | null
          rate?: number | null
          status?: Database["public"]["Enums"]["facture_status"] | null
          stripe_payment_intent?: string | null
          stripe_session_id?: string | null
          tva?: number | null
          url?: string | null
        }
        Update: {
          client_address_ligne1?: string | null
          client_address_ligne2?: string | null
          client_code_postal?: string | null
          client_name?: string
          client_pays?: string | null
          client_ville?: string | null
          conditions_paiement?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          date_emission?: string
          description?: string | null
          entreprise_id?: number
          hours?: number | null
          id?: number
          mention_tva?: string | null
          mission_id?: number | null
          montant_ht?: number
          montant_ttc?: number
          numero?: string
          payment_link?: string | null
          penalites_retard?: string | null
          rate?: number | null
          status?: Database["public"]["Enums"]["facture_status"] | null
          stripe_payment_intent?: string | null
          stripe_session_id?: string | null
          tva?: number | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "factures_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprise"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "factures_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      mission_templates: {
        Row: {
          client_id: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string | null
          etablissement: string
          etablissement_adresse_ligne1: string | null
          etablissement_adresse_ligne2: string | null
          etablissement_code_postal: string | null
          etablissement_pays: string | null
          etablissement_ville: string | null
          id: number
          instructions: string | null
          mode: string | null
          nom: string
        }
        Insert: {
          client_id?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          etablissement: string
          etablissement_adresse_ligne1?: string | null
          etablissement_adresse_ligne2?: string | null
          etablissement_code_postal?: string | null
          etablissement_pays?: string | null
          etablissement_ville?: string | null
          id?: never
          instructions?: string | null
          mode?: string | null
          nom: string
        }
        Update: {
          client_id?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          etablissement?: string
          etablissement_adresse_ligne1?: string | null
          etablissement_adresse_ligne2?: string | null
          etablissement_code_postal?: string | null
          etablissement_pays?: string | null
          etablissement_ville?: string | null
          id?: never
          instructions?: string | null
          mode?: string | null
          nom?: string
        }
        Relationships: []
      }
      missions: {
        Row: {
          client_id: string | null
          contact_email: string
          contact_name: string | null
          contact_phone: string
          created_at: string
          devis_url: string | null
          entreprise_id: number | null
          etablissement: string
          etablissement_adresse_ligne1: string | null
          etablissement_adresse_ligne2: string | null
          etablissement_code_postal: string | null
          etablissement_pays: string | null
          etablissement_ville: string | null
          freelance_id: string | null
          id: number
          instructions: string | null
          mode: Database["public"]["Enums"]["mission_mode"]
          status: Database["public"]["Enums"]["mission_status"]
        }
        Insert: {
          client_id?: string | null
          contact_email: string
          contact_name?: string | null
          contact_phone: string
          created_at?: string
          devis_url?: string | null
          entreprise_id?: number | null
          etablissement: string
          etablissement_adresse_ligne1?: string | null
          etablissement_adresse_ligne2?: string | null
          etablissement_code_postal?: string | null
          etablissement_pays?: string | null
          etablissement_ville?: string | null
          freelance_id?: string | null
          id?: number
          instructions?: string | null
          mode?: Database["public"]["Enums"]["mission_mode"]
          status?: Database["public"]["Enums"]["mission_status"]
        }
        Update: {
          client_id?: string | null
          contact_email?: string
          contact_name?: string | null
          contact_phone?: string
          created_at?: string
          devis_url?: string | null
          entreprise_id?: number | null
          etablissement?: string
          etablissement_adresse_ligne1?: string | null
          etablissement_adresse_ligne2?: string | null
          etablissement_code_postal?: string | null
          etablissement_pays?: string | null
          etablissement_ville?: string | null
          freelance_id?: string | null
          id?: number
          instructions?: string | null
          mode?: Database["public"]["Enums"]["mission_mode"]
          status?: Database["public"]["Enums"]["mission_status"]
        }
        Relationships: [
          {
            foreignKeyName: "missions_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprise"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          id: string
          role: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          role?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string | null
        }
        Relationships: []
      }
      slots: {
        Row: {
          created_at: string
          end: string | null
          entreprise_id: number | null
          id: number
          mission_id: number | null
          start: string | null
          title: string | null
        }
        Insert: {
          created_at?: string
          end?: string | null
          entreprise_id?: number | null
          id?: number
          mission_id?: number | null
          start?: string | null
          title?: string | null
        }
        Update: {
          created_at?: string
          end?: string | null
          entreprise_id?: number | null
          id?: number
          mission_id?: number | null
          start?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "slots_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprise"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "slots_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      facture_status: "pending_payment" | "paid" | "canceled"
      mission_mode: "freelance" | "salarié"
      mission_status:
        | "proposed"
        | "validated"
        | "pending_payment"
        | "paid"
        | "completed"
        | "refused"
        | "realized"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      facture_status: ["pending_payment", "paid", "canceled"],
      mission_mode: ["freelance", "salarié"],
      mission_status: [
        "proposed",
        "validated",
        "pending_payment",
        "paid",
        "completed",
        "refused",
        "realized",
      ],
    },
  },
} as const
