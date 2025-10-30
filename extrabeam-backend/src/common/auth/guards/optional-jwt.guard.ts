// src/common/auth/guards/optional-jwt.guard.ts
// -------------------------------------------------------------
// Garde JWT optionnel (auth non obligatoire)
// -------------------------------------------------------------
//
// 📌 Description :
//   - Étend JwtAuthGuard pour rendre l'authentification facultative
//   - Laisse passer les requêtes publiques sans header Authorization
//   - Continue de lever une erreur pour les tokens invalides/expirés
//
// 🔒 Règles d’accès :
//   - Token JWT absent → user = null (accès public)
//   - Token invalide/expiré → UnauthorizedException
//
// ⚠️ Remarques :
//   - Utilisé pour les routes offrant une vue publique mais enrichie pour les propriétaires
//   - Compatible avec le décorateur @User() (retourne null si non authentifié)
//
// -------------------------------------------------------------

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any) {
    if (err) {
      throw err;
    }

    if (user) {
      return user;
    }

    const message = typeof info === 'string' ? info : info?.message;

    if (!message) {
      return null;
    }

    if (message === 'No auth token' || message === 'No authorization token was found') {
      return null;
    }

    throw new UnauthorizedException(message);
  }
}
