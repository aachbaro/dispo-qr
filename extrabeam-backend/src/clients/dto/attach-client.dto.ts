// src/clients/dto/attach-client.dto.ts
// -------------------------------------------------------------
// DTO : Attacher un client à une entreprise
// -------------------------------------------------------------
//
// 📌 Description :
//   - Utilisé par POST /api/clients/attach
//
// -------------------------------------------------------------

export interface AttachClientDto {
  client_id: string;
}
