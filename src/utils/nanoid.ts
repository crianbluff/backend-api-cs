import { nanoid } from 'nanoid';

/** Generates a unique guest ID (11 chars). */
export function generateGuestId(): string {
  return nanoid(11);
}

/** Generates a unique couple ID (18 chars). */
export function generateCoupleId(): string {
  return nanoid(18);
}
