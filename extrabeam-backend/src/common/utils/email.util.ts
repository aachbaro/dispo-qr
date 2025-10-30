import type { Tables } from '../types/database';

type MissionWithClient = Partial<Tables<'missions'>> & {
  client?: { email?: string | null } | null;
  contact_email?: string | null;
};

type FactureWithMission = Partial<Tables<'factures'>> & {
  missions?: MissionWithClient | null;
  contact_email?: string | null;
};

export function getClientEmailFromMission(mission: MissionWithClient): string | null {
  if (mission?.client?.email) {
    return mission.client.email;
  }
  if (mission?.contact_email) {
    return mission.contact_email;
  }
  return null;
}

export function getClientEmailFromFacture(facture: FactureWithMission): string | null {
  if (facture?.missions?.client?.email) {
    return facture.missions.client.email;
  }
  if (facture?.missions?.contact_email) {
    return facture.missions.contact_email;
  }
  if (facture?.contact_email) {
    return facture.contact_email;
  }
  return null;
}
