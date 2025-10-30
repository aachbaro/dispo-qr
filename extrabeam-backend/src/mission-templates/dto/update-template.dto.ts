// src/mission-templates/dto/update-template.dto.ts
// -------------------------------------------------------------
// DTO : Mise à jour d'un template de mission
// -------------------------------------------------------------

import type { TablesUpdate } from '../../common/types/database';

export type UpdateTemplateDto = TablesUpdate<'mission_templates'>;
