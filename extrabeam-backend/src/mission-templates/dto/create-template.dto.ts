// src/mission-templates/dto/create-template.dto.ts
// -------------------------------------------------------------
// DTO : Création d'un template de mission
// -------------------------------------------------------------

import type { TablesInsert } from '../../common/types/database';

export type CreateTemplateDto = TablesInsert<'mission_templates'>;
