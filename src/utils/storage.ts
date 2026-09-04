import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../data/userTypes';

// Storage Keys
const KEYS = {
  AUTH_TOKEN: '@auth_token',
  CURRENT_USER: '@current_user',
  AUTH_USER: '@auth_user',
  USERS: '@users',
};

// Auth Token Management
export const saveAuthToken = async (token: string): Promise<void> => {
  await AsyncStorage.setItem(KEYS.AUTH_TOKEN, token);
};

export const getAuthToken = async (): Promise<string | null> => {
  return await AsyncStorage.getItem(KEYS.AUTH_TOKEN);
};

export const checkAuthToken = async (): Promise<boolean> => {
  const token = await getAuthToken();
  return token !== null;
};

export const clearAuthToken = async (): Promise<void> => {
  await AsyncStorage.removeItem(KEYS.AUTH_TOKEN);
};

// User Management
export const saveCurrentUser = async (user: User): Promise<void> => {
  await AsyncStorage.multiSet([
    [KEYS.CURRENT_USER, JSON.stringify(user)],
    [KEYS.AUTH_USER, JSON.stringify(user)],
  ]);
};

export const getCurrentUser = async (): Promise<User | null> => {
  const data =
    (await AsyncStorage.getItem(KEYS.CURRENT_USER)) ||
    (await AsyncStorage.getItem(KEYS.AUTH_USER));
  return data ? JSON.parse(data) : null;
};

export const saveUser = async (user: User): Promise<void> => {
  const users = await getAllUsers();
  const normalizedBarcode = user.barcode.trim().toUpperCase();
  const normalizedUser = { ...user, barcode: normalizedBarcode };
  const index = users.findIndex(
    u => u.id === user.id || u.barcode.trim().toUpperCase() === normalizedBarcode
  );
  
  if (index >= 0) {
    users[index] = normalizedUser;
  } else {
    users.push(normalizedUser);
  }
  
  await AsyncStorage.setItem(KEYS.USERS, JSON.stringify(users));
};

export const getAllUsers = async (): Promise<User[]> => {
  const data = await AsyncStorage.getItem(KEYS.USERS);
  return data ? JSON.parse(data) : [];
};

export const getUserByBarcode = async (barcode: string): Promise<User | null> => {
  const users = await getAllUsers();
  const normalizedBarcode = barcode.trim().toUpperCase();
  return users.find(u => u.barcode.toUpperCase() === normalizedBarcode) || null;
};

export const updateUser = async (userId: string, updates: Partial<User>): Promise<void> => {
  const users = await getAllUsers();
  const index = users.findIndex(u => u.id === userId);
  
  if (index >= 0) {
    users[index] = { ...users[index], ...updates };
    await AsyncStorage.setItem(KEYS.USERS, JSON.stringify(users));
    
    // Update current user if it's the same
    const currentUser = await getCurrentUser();
    if (currentUser && currentUser.id === userId) {
      await saveCurrentUser(users[index]);
    }
  }
};

// Clear All Data (for logout)
export const clearAllData = async (): Promise<void> => {
  await AsyncStorage.multiRemove([
    KEYS.AUTH_TOKEN,
    KEYS.CURRENT_USER,
    KEYS.AUTH_USER,
  ]);
};
