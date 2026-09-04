import BarcodeValidationService, { MOCK_BARCODES } from '../services/BarcodeValidationService';

export { MOCK_BARCODES };

export const validateBarcode = (code: string) => {
  return BarcodeValidationService.validate(code);
};
