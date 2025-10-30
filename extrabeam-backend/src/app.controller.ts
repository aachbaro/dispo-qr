// src/app.controller.ts
// -------------------------------------------------------------
// Contrôleur : Application (Healthcheck)
// -------------------------------------------------------------
//
// 📌 Description :
//   - Expose des endpoints transverses à l’application (ex: healthcheck)
//   - Utilisé par les probes de déploiement pour vérifier l’état du service
//
// 📍 Endpoints :
//   - GET /api/health
//
// 🔒 Règles d’accès :
//   - Endpoint public (aucune authentification requise)
//
// ⚠️ Remarques :
//   - Peut être enrichi plus tard (versions, uptime, etc.)
//
// -------------------------------------------------------------

import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('/api/health')
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
