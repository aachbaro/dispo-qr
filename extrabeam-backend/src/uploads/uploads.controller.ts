// src/uploads/uploads.controller.ts
// -------------------------------------------------------------
// Contrôleur : Uploads
// -------------------------------------------------------------

import { Body, Controller, Post, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../common/auth/guards/jwt.guard';
import { UploadsService } from './uploads.service';

interface StoragePayload {
  bucket: string;
  path: string;
}

@Controller('uploads')
@UseGuards(JwtAuthGuard)
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('public-url')
  async getPublicUrl(@Body() body: StoragePayload) {
    return this.uploadsService.getPublicUrl(body.bucket, body.path);
  }

  @Post('put-signed-url')
  async getSignedUrl(@Body() body: StoragePayload) {
    return this.uploadsService.createSignedUploadUrl(body.bucket, body.path);
  }
}
