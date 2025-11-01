// src/payments/payments.controller.ts
// -------------------------------------------------------------
// Contrôleur : Paiements
// -------------------------------------------------------------

import { Controller, Param, ParseIntPipe, Post, Req, UseGuards } from '@nestjs/common'
import type { Request } from 'express'

import type { AuthUser } from '../common/auth/auth.types'
import { User } from '../common/auth/decorators/user.decorator'
import { JwtAuthGuard } from '../common/auth/guards/jwt.guard'
import { PaymentsService } from './payments.service'

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('factures/:id/session')
  @UseGuards(JwtAuthGuard)
  async createSession(
    @Param('id', ParseIntPipe) id: number,
    @User() user: AuthUser,
  ): Promise<{ url: string; sessionId: string; paymentIntent: string }> {
    return this.paymentsService.createCheckoutForFacture(id, user)
  }

  @Post('webhook')
  async handleWebhook(@Req() req: Request): Promise<{ received: true }> {
    const signature = req.headers['stripe-signature']
    if (!signature) {
      throw new Error('Signature Stripe manquante')
    }

    type RawBodyRequest = Request & { rawBody?: Buffer }
    const requestWithRawBody = req as RawBodyRequest
    const rawBody = requestWithRawBody.rawBody
      ? requestWithRawBody.rawBody
      : Buffer.from(JSON.stringify(req.body ?? {}))

    await this.paymentsService.handleWebhook(rawBody, signature as string)
    return { received: true }
  }
}
