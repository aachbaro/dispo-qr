export interface EntreprisePayload {
  nom?: string;
  prenom?: string;
  adresse_ligne1?: string;
  adresse_ligne2?: string | null;
  ville?: string | null;
  code_postal?: string | null;
  pays?: string | null;
  telephone?: string | null;
  siret?: string | null;
  statut_juridique?: string | null;
  tva_intracom?: string | null;
  mention_tva?: string | null;
  iban?: string | null;
  bic?: string | null;
  taux_horaire?: number | null;
  devise?: string | null;
  conditions_paiement?: string | null;
  penalites_retard?: string | null;
}

export interface RegisterDto {
  email: string;
  password: string;
  role: 'freelance' | 'client';
  entreprise?: EntreprisePayload | null;
}
