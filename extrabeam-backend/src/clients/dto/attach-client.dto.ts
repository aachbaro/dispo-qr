// src/clients/dto/attach-client.dto.ts
// -------------------------------------------------------------
// DTO : Attacher un client à une entreprise
// -------------------------------------------------------------
//
// 📌 Description :
//   - Utilisé par POST /api/clients/attach
//
// -------------------------------------------------------------

import { IsNotEmpty, IsString } from 'class-validator'

import type { Table } from '../../types/aliases'

type ClientRow = Table<'clients'>

export class AttachClientDto {
  @IsString()
  @IsNotEmpty()
  client_id!: ClientRow['id']
}
