/**
 * User Profile Service
 * Handles user profile management, updates, and retrieval
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../data/userTypes';
import AuthenticationService from './AuthenticationService';

const USERS_KEY = '@users';
const CURRENT_USER_KEY = '@auth_user';
const LEGACY_CURRENT_USER_KEY = '@current_user';

export interface ProfileUpdateData {
  name?: string;
  age?: number;
  height?: number;
  weight?: number;
  gender?: 'male' | 'female';
  birthDate?: string;
  school?: string;
  about?: string;
  isVerified?: boolean;
  loginMethod?: 'email' | 'code' | 'barcode' | null;
  password?: string;
  education?: string;
  occupation?: string;
  phone?: string;
  email?: string;
}

export interface ProfileResponse {
  success: boolean;
  user?: User;
  error?: string;
}

class UserProfileService {
  /**
   * Get user profile by ID
   */
  async getUserProfile(userId: string): Promise<User | null> {
    try {
      const usersJson = await AsyncStorage.getItem(USERS_KEY);
      if (!usersJson) {
        return null;
      }

      const users: User[] = JSON.parse(usersJson);
      const user = users.find(u => u.id === userId);
      return user || null;
    } catch (error) {
      console.error('Get user profile error:', error);
      return null;
    }
  }

  /**
   * Get user profile by barcode
   */
  async getUserByBarcode(barcode: string): Promise<User | null> {
    try {
      const usersJson = await AsyncStorage.getItem(USERS_KEY);
      if (!usersJson) {
        return null;
      }

      const users: User[] = JSON.parse(usersJson);
      const normalizedBarcode = barcode.trim().toUpperCase();
      const user = users.find(u => u.barcode.trim().toUpperCase() === normalizedBarcode);
      return user || null;
    } catch (error) {
      console.error('Get user by barcode error:', error);
      return null;
    }
  }

  /**
   * Get current logged-in user profile
   */
  async getCurrentUserProfile(): Promise<User | null> {
    try {
      const user = await AuthenticationService.getCurrentUser();
      return user;
    } catch (error) {
      console.error('Get current user profile error:', error);
      return null;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updateData: ProfileUpdateData): Promise<ProfileResponse> {
    try {
      const usersJson = await AsyncStorage.getItem(USERS_KEY);
      if (!usersJson) {
        return {
          success: false,
          error: 'Users data not found'
        };
      }

      const users: User[] = JSON.parse(usersJson);
      const userIndex = users.findIndex(u => u.id === userId);

      if (userIndex === -1) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      const cleanUpdateData = Object.fromEntries(
        Object.entries(updateData).filter(([, value]) => value !== undefined)
      ) as ProfileUpdateData;

      // Update user data
      const updatedUser: User = {
        ...users[userIndex],
        ...cleanUpdateData,
        updatedAt: Date.now()
      };

      users[userIndex] = updatedUser;

      // Save to storage
      await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));

      // Update current user if it's the logged-in user
      const currentUser = await AuthenticationService.getCurrentUser();
      if (currentUser && currentUser.id === userId) {
        const userJson = JSON.stringify(updatedUser);
        await AsyncStorage.multiSet([
          [CURRENT_USER_KEY, userJson],
          [LEGACY_CURRENT_USER_KEY, userJson],
        ]);
      }

      return {
        success: true,
        user: updatedUser
      };
    } catch (error) {
      console.error('Update profile error:', error);
      return {
        success: false,
        error: 'Failed to update profile'
      };
    }
  }

  /**
   * Update current user profile
   */
  async updateCurrentUserProfile(updateData: ProfileUpdateData): Promise<ProfileResponse> {
    try {
      const currentUser = await AuthenticationService.getCurrentUser();
      if (!currentUser) {
        return {
          success: false,
          error: 'No user logged in'
        };
      }

      return this.updateProfile(currentUser.id, updateData);
    } catch (error) {
      console.error('Update current user profile error:', error);
      return {
        success: false,
        error: 'Failed to update profile'
      };
    }
  }

  /**
   * Delete user profile
   */
  async deleteProfile(userId: string): Promise<boolean> {
    try {
      const usersJson = await AsyncStorage.getItem(USERS_KEY);
      if (!usersJson) {
        return false;
      }

      const users: User[] = JSON.parse(usersJson);
      const filteredUsers = users.filter(u => u.id !== userId);

      await AsyncStorage.setItem(USERS_KEY, JSON.stringify(filteredUsers));

      // If deleting current user, logout
      const currentUser = await AuthenticationService.getCurrentUser();
      if (currentUser && currentUser.id === userId) {
        await AuthenticationService.logout();
      }

      return true;
    } catch (error) {
      console.error('Delete profile error:', error);
      return false;
    }
  }

  /**
   * Get all users (admin function)
   */
  async getAllUsers(): Promise<User[]> {
    try {
      const usersJson = await AsyncStorage.getItem(USERS_KEY);
      if (!usersJson) {
        return [];
      }

      const users: User[] = JSON.parse(usersJson);
      return users;
    } catch (error) {
      console.error('Get all users error:', error);
      return [];
    }
  }

  /**
   * Search users by name
   */
  async searchUsers(query: string): Promise<User[]> {
    try {
      const users = await this.getAllUsers();
      const lowerQuery = query.toLowerCase();
      
      return users.filter(user => 
        user.name.toLowerCase().includes(lowerQuery) ||
        user.barcode.toLowerCase().includes(lowerQuery)
      );
    } catch (error) {
      console.error('Search users error:', error);
      return [];
    }
  }

  /**
   * Check if barcode is already registered
   */
  async isBarcodeRegistered(barcode: string): Promise<boolean> {
    try {
      const user = await this.getUserByBarcode(barcode);
      return user !== null;
    } catch (error) {
      console.error('Check barcode error:', error);
      return false;
    }
  }

  /**
   * Get user statistics
   */
  async getUserStatistics(userId: string): Promise<{
    totalGamesPlayed: number;
    totalLevelsCompleted: number;
    averageScore: number;
    bestScore: number;
    totalPlayTime: number;
  } | null> {
    try {
      const performanceKey = `@game_performance_${userId}`;
      const performanceJson = await AsyncStorage.getItem(performanceKey);
      
      if (!performanceJson) {
        return {
          totalGamesPlayed: 0,
          totalLevelsCompleted: 0,
          averageScore: 0,
          bestScore: 0,
          totalPlayTime: 0
        };
      }

      const performances = JSON.parse(performanceJson);
      
      const totalGamesPlayed = performances.length;
      const totalLevelsCompleted = performances.filter((p: any) => p.completed).length;
      const scores = performances.map((p: any) => p.score || 0);
      const averageScore = scores.length > 0 
        ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length 
        : 0;
      const bestScore = scores.length > 0 ? Math.max(...scores) : 0;
      const totalPlayTime = performances.reduce((total: number, p: any) => 
        total + (p.completionTime || 0), 0
      );

      return {
        totalGamesPlayed,
        totalLevelsCompleted,
        averageScore: Math.round(averageScore),
        bestScore,
        totalPlayTime
      };
    } catch (error) {
      console.error('Get user statistics error:', error);
      return null;
    }
  }

  /**
   * Update user avatar/profile picture
   */
  async updateAvatar(userId: string, avatarUri: string): Promise<boolean> {
    try {
      return (await this.updateProfile(userId, { 
        // @ts-ignore - extending User type
        avatar: avatarUri 
      })).success;
    } catch (error) {
      console.error('Update avatar error:', error);
      return false;
    }
  }

  /**
   * Get user preferences
   */
  async getUserPreferences(userId: string): Promise<any> {
    try {
      const preferencesKey = `@user_preferences_${userId}`;
      const preferencesJson = await AsyncStorage.getItem(preferencesKey);
      
      if (!preferencesJson) {
        return this.getDefaultPreferences();
      }

      return JSON.parse(preferencesJson);
    } catch (error) {
      console.error('Get user preferences error:', error);
      return this.getDefaultPreferences();
    }
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(userId: string, preferences: any): Promise<boolean> {
    try {
      const preferencesKey = `@user_preferences_${userId}`;
      await AsyncStorage.setItem(preferencesKey, JSON.stringify(preferences));
      return true;
    } catch (error) {
      console.error('Update user preferences error:', error);
      return false;
    }
  }

  /**
   * Get default preferences
   */
  private getDefaultPreferences() {
    return {
      soundEnabled: true,
      musicEnabled: true,
      notificationsEnabled: true,
      theme: 'light',
      language: 'id'
    };
  }

  /**
   * Export user data (for GDPR compliance)
   */
  async exportUserData(userId: string): Promise<any> {
    try {
      const user = await this.getUserProfile(userId);
      const statistics = await this.getUserStatistics(userId);
      const preferences = await this.getUserPreferences(userId);
      
      const performanceKey = `@game_performance_${userId}`;
      const performanceJson = await AsyncStorage.getItem(performanceKey);
      const performances = performanceJson ? JSON.parse(performanceJson) : [];

      return {
        profile: user,
        statistics,
        preferences,
        gameHistory: performances,
        exportedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Export user data error:', error);
      return null;
    }
  }
}

// Export singleton instance
export default new UserProfileService();
