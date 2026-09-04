// Data Types untuk User Management dan Barcode Login

export interface User {
  id: string;
  barcode: string;
  name: string;
  email: string;
  phone: string;
  password?: string;
  gender?: 'male' | 'female';
  birthDate?: string;
  school?: string;
  weight?: number;
  about?: string;
  isVerified?: boolean;
  loginMethod?: 'email' | 'code' | 'barcode' | null;
  age?: number;
  height?: number;
  photoUri?: string;
  level: number;
  createdAt: number | string;
  updatedAt?: number;
}

export interface BarcodeData {
  code: string;
  userId?: string;
  isValid: boolean;
}
