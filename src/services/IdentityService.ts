import { User } from '../data/userTypes';
import AuthenticationService, { AuthResponse } from './AuthenticationService';
import BarcodeValidationService from './BarcodeValidationService';
import SessionManager from './SessionManager';
import UserProfileService from './UserProfileService';

export interface IdentityProfile {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  loginMethod?: User['loginMethod'];
}

class IdentityService {
  async loginWithBarcode(barcode: string): Promise<AuthResponse> {
    const barcodeData = BarcodeValidationService.validate(barcode);
    if (!barcodeData?.isValid) {
      return { success: false, error: 'Barcode tidak valid' };
    }

    return this.loginOrCreate(barcodeData.code, {
      name: 'User',
      loginMethod: 'barcode',
    });
  }

  async loginWithCode(code: string): Promise<AuthResponse> {
    const normalizedCode = BarcodeValidationService.normalize(code);
    if (!normalizedCode) {
      return { success: false, error: 'Kode tidak valid' };
    }

    return this.loginOrCreate(`CODE:${normalizedCode}`, {
      name: 'User',
      loginMethod: 'code',
    });
  }

  async registerWithEmail(
    email: string,
    password: string,
    name?: string
  ): Promise<AuthResponse> {
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await this.getUserByEmail(normalizedEmail);

    if (existingUser) {
      return { success: false, error: 'Email sudah terdaftar' };
    }

    return this.loginOrCreate(`EMAIL:${normalizedEmail}`, {
      name: name?.trim() || this.nameFromEmail(normalizedEmail),
      email: normalizedEmail,
      password,
      loginMethod: 'email',
    });
  }

  async loginWithEmail(email: string, password: string): Promise<AuthResponse> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.getUserByEmail(normalizedEmail);

    if (!user) {
      return { success: false, error: 'Email belum terdaftar' };
    }

    if (user.password && user.password !== password) {
      return { success: false, error: 'Password tidak sesuai' };
    }

    return this.finishLogin(user.barcode);
  }

  private async loginOrCreate(
    barcode: string,
    profile: IdentityProfile
  ): Promise<AuthResponse> {
    const existingUser = await UserProfileService.getUserByBarcode(barcode);
    if (existingUser) {
      return this.finishLogin(existingUser.barcode);
    }

    const now = Date.now();
    const user: User = {
      id: `user_${now}_${Math.random().toString(36).slice(2, 8)}`,
      barcode,
      name: profile.name || 'User',
      email: profile.email || '',
      phone: profile.phone || '',
      password: profile.password,
      loginMethod: profile.loginMethod || null,
      isVerified: false,
      level: 1,
      createdAt: now,
      updatedAt: now,
    };

    const response = await AuthenticationService.registerAndLogin(user);
    if (response.success && response.user) {
      await SessionManager.startSession(response.user.id);
    }
    return response;
  }

  private async finishLogin(barcode: string): Promise<AuthResponse> {
    const response = await AuthenticationService.loginWithBarcode(barcode);
    if (response.success && response.user) {
      await SessionManager.startSession(response.user.id);
    }
    return response;
  }

  private async getUserByEmail(email: string): Promise<User | null> {
    const users = await UserProfileService.getAllUsers();
    return users.find(user => user.email.trim().toLowerCase() === email) || null;
  }

  private nameFromEmail(email: string): string {
    const localPart = email.split('@')[0] || 'User';
    return localPart.charAt(0).toUpperCase() + localPart.slice(1);
  }
}

export default new IdentityService();
