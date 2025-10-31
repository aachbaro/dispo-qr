// src/clients/dto/attach-client.dto.ts
// -------------------------------------------------------------
// DTO : Attacher un client à une entreprise
// -------------------------------------------------------------
//
// 📌 Description :
//   - Utilisé par POST /api/clients/attach
//
// -------------------------------------------------------------

import { IsNotEmpty, IsString } from 'class-validator';

import type { Database } from '../../types/database';

type Table<Name extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][Name]['Row'];

type ClientRow = Table<'clients'>;

export class AttachClientDto {
  @IsString()
  @IsNotEmpty()
  client_id!: ClientRow['id'];
}
