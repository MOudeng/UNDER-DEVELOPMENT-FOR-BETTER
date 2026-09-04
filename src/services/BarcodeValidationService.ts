/**
 * Barcode Validation Service
 * Satu tempat untuk normalisasi dan validasi barcode.
 */

import { BarcodeData } from '../data/userTypes';

export const MOCK_BARCODES: BarcodeData[] = [
  { code: 'USER001', userId: undefined, isValid: true },
  { code: 'USER002', userId: undefined, isValid: true },
  { code: 'USER003', userId: undefined, isValid: true },
  { code: 'ADMIN001', userId: undefined, isValid: true },
];

class BarcodeValidationService {
  normalize(code: string): string {
    return code.trim().toUpperCase();
  }

  validate(code: string): BarcodeData | null {
    const normalized = this.normalize(code);

    if (normalized.length === 0) {
      return null;
    }

    const registeredMock = MOCK_BARCODES.find(
      barcode => barcode.code.toUpperCase() === normalized
    );

    if (registeredMock) {
      return registeredMock;
    }

    return {
      code: normalized,
      userId: undefined,
      isValid: true,
    };
  }

  isValid(code: string): boolean {
    return Boolean(this.validate(code)?.isValid);
  }
}

export default new BarcodeValidationService();
