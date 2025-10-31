import { IsNumber, IsOptional, IsString } from 'class-validator'

import type { Database } from '../../types/database'

type Insert<Name extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][Name]['Insert']

type EntrepriseInsert = Insert<'entreprise'>

// Cette classe valide la forme d’un payload conforme à Insert<'entreprise'>
// sans chercher à implémenter l’interface générée
export class EntrepriseCreateDto {
  @IsString()
  adresse_ligne1!: EntrepriseInsert['adresse_ligne1']

  @IsOptional()
  @IsString()
  adresse_ligne2?: EntrepriseInsert['adresse_ligne2']

  @IsString()
  bic!: EntrepriseInsert['bic']

  @IsOptional()
  @IsString()
  code_postal?: EntrepriseInsert['code_postal']

  @IsOptional()
  @IsString()
  conditions_paiement?: EntrepriseInsert['conditions_paiement']

  @IsOptional()
  @IsString()
  created_at?: EntrepriseInsert['created_at']

  @IsOptional()
  @IsString()
  devise?: EntrepriseInsert['devise']

  @IsString()
  email!: EntrepriseInsert['email']

  @IsString()
  iban!: EntrepriseInsert['iban']

  @IsOptional()
  @IsString()
  mention_tva?: EntrepriseInsert['mention_tva']

  @IsString()
  nom!: EntrepriseInsert['nom']

  @IsOptional()
  @IsString()
  pays?: EntrepriseInsert['pays']

  @IsOptional()
  @IsString()
  penalites_retard?: EntrepriseInsert['penalites_retard']

  @IsString()
  prenom!: EntrepriseInsert['prenom']

  @IsString()
  siret!: EntrepriseInsert['siret']

  @IsOptional()
  @IsString()
  slug?: EntrepriseInsert['slug']

  @IsOptional()
  @IsString()
  statut_juridique?: EntrepriseInsert['statut_juridique']

  @IsOptional()
  @IsString()
  stripe_account_id?: EntrepriseInsert['stripe_account_id']

  @IsOptional()
  @IsNumber()
  taux_horaire?: EntrepriseInsert['taux_horaire']

  @IsOptional()
  @IsString()
  telephone?: EntrepriseInsert['telephone']

  @IsOptional()
  @IsString()
  tva_intracom?: EntrepriseInsert['tva_intracom']

  @IsOptional()
  @IsString()
  updated_at?: EntrepriseInsert['updated_at']

  @IsOptional()
  @IsString()
  user_id?: EntrepriseInsert['user_id']

  @IsOptional()
  @IsString()
  ville?: EntrepriseInsert['ville']
}
