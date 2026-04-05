/**
 * Serviceable pincodes — Pondicherry (Puducherry) district only.
 * Includes Pondicherry city, surrounding communes, and Bahoor.
 */
export const PONDICHERRY_PINCODES = new Set([
  // Pondicherry city & immediate areas
  '605001', '605002', '605003', '605004', '605005',
  '605006', '605007', '605008', '605009', '605010',
  '605011', '605012', '605013', '605014',
  // Surrounding communes & villages
  // Bahoor commune
  '607402',
]);

export const isPondicherryPincode = (zip: string): boolean =>
  PONDICHERRY_PINCODES.has(zip.trim());

export const SERVICE_AREA_LABEL = 'Pondicherry';
export const SERVICE_STATE = 'Puducherry';
