export const FACTURE_STATUS_VALUES = ['pending_payment', 'paid', 'canceled'] as const;

export type FactureStatusValue = (typeof FACTURE_STATUS_VALUES)[number];
