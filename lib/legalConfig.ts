/**
 * Legal configuration — fill in placeholders before going live.
 * These values appear in /legal/* pages.
 */

export const legalConfig = {
  OPERATOR_NAME: process.env.OPERATOR_NAME ?? "Leïla Kissner",
  OPERATOR_ADDRESS: process.env.OPERATOR_ADDRESS ?? "Rue du Champ-Fort 6, 2853 Courfaivre",
  OPERATOR_COUNTRY: process.env.OPERATOR_COUNTRY ?? "Switzerland",
  CONTACT_EMAIL: process.env.CONTACT_EMAIL ?? "contact.vegsage@gmail.com",
  GOVERNING_LAW: process.env.GOVERNING_LAW ?? "Switzerland",
  APP_NAME: "VegSage",
  APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "https://vegsage.com",
  LAST_UPDATED: "2026-03-05",
} as const;

export type LegalConfig = typeof legalConfig;
