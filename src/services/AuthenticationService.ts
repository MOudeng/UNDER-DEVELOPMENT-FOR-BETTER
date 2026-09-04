/**
 * Authentication Service
 * Handles user authentication, login, logout, and session validation
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../data/userTypes';

const AUTH_TOKEN_KEY = '@auth_token';
const AUTH_USER_KEY = '@auth_user';
const CURRENT_USER_KEY = '@current_user';
const AUTH_SESSION_KEY = '@auth_session';

export interface AuthSession {
  userId: string;
  token: string;
  loginTime: number;
  expiresAt: number;
  deviceId?: string;
}

export interface LoginCredentials {
  barcode: string;
  password?: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  session?: AuthSession;
  error?: string;
}

class AuthenticationService {
  private currentSession: AuthSession | null = null;
  private sessionCheckInterval: ReturnType<typeof setInterval> | null = null;

  /**
   * Initialize authentication service
   * Check for existing session on app start
   */
  async initialize(): Promise<boolean> {
    try {
      const session = await this.getStoredSession();
      if (session && this.isSessionValid(session)) {
        this.currentSession = session;
        this.startSessionMonitoring();
        return true;
      } else {
        await this.clearSession();
        return false;
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      return false;
    }
  }

  /**
   * Login with barcode
   */
  async loginWithBarcode(barcode: string): Promise<AuthResponse> {
    try {
      // Normalize barcode (uppercase and trim)
      const normalizedBarcode = barcode.trim().toUpperCase();
      
      console.log('🔐 Attempting login with barcode:', normalizedBarcode);

      // Validate barcode format
      if (!normalizedBarcode || normalizedBarcode.length === 0) {
        return {
          success: false,
          error: 'Barcode tidak valid'
        };
      }

      // Check if user exists in storage (case-insensitive)
      const usersJson = await AsyncStorage.getItem('@users');
      const users: User[] = usersJson ? JSON.parse(usersJson) : [];
      
      console.log('📋 Total users in storage:', users.length);
      
      const user = users.find(u => u.barcode.toUpperCase() === normalizedBarcode);

      if (!user) {
        console.log('❌ User not found for barcode:', normalizedBarcode);
        return {
          success: false,
          error: 'User tidak ditemukan. Silakan registrasi terlebih dahulu.'
        };
      }

      console.log('✅ User found:', user.name);

      // Create session
      const session = await this.createSession(user.id);

      // Store session
      await this.storeSession(session);
      await this.storeUser(user);

      this.currentSession = session;
      this.startSessionMonitoring();

      console.log('✅ Login successful for user:', user.name);

      return {
        success: true,
        user,
        session
      };
    } catch (error) {
      console.error('❌ Login error:', error);
      return {
        success: false,
        error: 'Terjadi kesalahan saat login'
      };
    }
  }

  /**
   * Login with credentials (barcode + password)
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    return this.loginWithBarcode(credentials.barcode);
  }

  /**
   * Register new user and auto-login
   */
  async registerAndLogin(user: User): Promise<AuthResponse> {
    try {
      // Normalize barcode (uppercase and trim)
      const normalizedBarcode = user.barcode.trim().toUpperCase();
      const normalizedUser = {
        ...user,
        barcode: normalizedBarcode
      };

      // Store or replace user by barcode so re-registration refreshes the profile.
      const usersJson = await AsyncStorage.getItem('@users');
      const users: User[] = usersJson ? JSON.parse(usersJson) : [];
      
      const existingUserIndex = users.findIndex(u =>
        u.barcode.toUpperCase() === normalizedBarcode
      );

      const userToSave: User = existingUserIndex >= 0
        ? {
            ...users[existingUserIndex],
            ...normalizedUser,
            id: users[existingUserIndex].id,
            level: users[existingUserIndex].level,
            createdAt: users[existingUserIndex].createdAt,
            updatedAt: Date.now()
          }
        : normalizedUser;

      if (existingUserIndex >= 0) {
        users[existingUserIndex] = userToSave;
      } else {
        users.push(userToSave);
      }

      await AsyncStorage.setItem('@users', JSON.stringify(users));

      console.log(existingUserIndex >= 0 ? '✅ User profile replaced:' : '✅ User registered:', userToSave);

      // Auto-login with normalized barcode
      return this.loginWithBarcode(normalizedBarcode);
    } catch (error) {
      console.error('Register error:', error);
      return {
        success: false,
        error: 'Terjadi kesalahan saat registrasi'
      };
    }
  }

  /**
   * Logout current user
   */
  async logout(): Promise<boolean> {
    try {
      await this.clearSession();
      this.stopSessionMonitoring();
      this.currentSession = null;
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      return false;
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      if (this.currentSession && this.isSessionValid(this.currentSession)) {
        return true;
      }

      const session = await this.getStoredSession();
      if (session && this.isSessionValid(session)) {
        this.currentSession = session;
        return true;
      }

      return false;
    } catch (error) {
      console.error('Auth check error:', error);
      return false;
    }
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const userJson = await AsyncStorage.getItem(AUTH_USER_KEY);
      if (userJson) {
        return JSON.parse(userJson);
      }
      return null;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  /**
   * Get current session
   */
  getCurrentSession(): AuthSession | null {
    return this.currentSession;
  }

  /**
   * Refresh session (extend expiration)
   */
  async refreshSession(): Promise<boolean> {
    try {
      if (!this.currentSession) {
        return false;
      }

      const newSession: AuthSession = {
        ...this.currentSession,
        expiresAt: Date.now() + (24 * 60 * 60 * 1000) // Extend 24 hours
      };

      await this.storeSession(newSession);
      this.currentSession = newSession;
      return true;
    } catch (error) {
      console.error('Refresh session error:', error);
      return false;
    }
  }

  /**
   * Validate session token
   */
  async validateToken(token: string): Promise<boolean> {
    try {
      const session = await this.getStoredSession();
      return session?.token === token && this.isSessionValid(session);
    } catch (error) {
      console.error('Validate token error:', error);
      return false;
    }
  }

  // Private methods

  private async createSession(userId: string): Promise<AuthSession> {
    const token = this.generateToken();
    const now = Date.now();
    
    return {
      userId,
      token,
      loginTime: now,
      expiresAt: now + (24 * 60 * 60 * 1000), // 24 hours
      deviceId: 'device-' + Math.random().toString(36).substr(2, 9)
    };
  }

  private generateToken(): string {
    return 'token_' + Date.now() + '_' + Math.random().toString(36).substr(2, 16);
  }

  private isSessionValid(session: AuthSession): boolean {
    return Date.now() < session.expiresAt;
  }

  private async storeSession(session: AuthSession): Promise<void> {
    await AsyncStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, session.token);
  }

  private async storeUser(user: User): Promise<void> {
    const userJson = JSON.stringify(user);
    await AsyncStorage.multiSet([
      [AUTH_USER_KEY, userJson],
      [CURRENT_USER_KEY, userJson],
    ]);
  }

  private async getStoredSession(): Promise<AuthSession | null> {
    try {
      const sessionJson = await AsyncStorage.getItem(AUTH_SESSION_KEY);
      if (sessionJson) {
        return JSON.parse(sessionJson);
      }
      return null;
    } catch (error) {
      console.error('Get stored session error:', error);
      return null;
    }
  }

  private async clearSession(): Promise<void> {
    await AsyncStorage.multiRemove([
      AUTH_TOKEN_KEY,
      AUTH_USER_KEY,
      CURRENT_USER_KEY,
      AUTH_SESSION_KEY
    ]);
  }

  private startSessionMonitoring(): void {
    // Check session validity every 5 minutes
    this.sessionCheckInterval = setInterval(async () => {
      if (this.currentSession && !this.isSessionValid(this.currentSession)) {
        console.log('Session expired, logging out...');
        await this.logout();
      }
    }, 5 * 60 * 1000);
  }

  private stopSessionMonitoring(): void {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = null;
    }
  }
}

// Export singleton instance
export default new AuthenticationService();
