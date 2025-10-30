// src/clients/clients.module.ts
// -------------------------------------------------------------
// Module : Clients
// -------------------------------------------------------------
//
// 📌 Description :
//   - Encapsule la gestion des clients liés à une entreprise
//
// -------------------------------------------------------------

import { Module } from '@nestjs/common';

import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';

@Module({
  controllers: [ClientsController],
  providers: [ClientsService],
  exports: [ClientsService],
})
export class ClientsModule {}
