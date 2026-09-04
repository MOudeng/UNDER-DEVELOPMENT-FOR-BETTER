import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { User } from "../data/userTypes";
import {
  AuthenticationService,
  SessionManager,
  UserProfileService,
} from "../services";

export interface UserData {
  id?: string;
  barcode?: string;
  name: string;
  email: string;
  phone?: string;
  password?: string;
  isVerified: boolean;
  loginMethod: "email" | "code" | "barcode" | null;
  profilePhoto?: string;
  joinDate?: string;
  age?: number;
  height?: number;
  weight?: number;
  gender?: "male" | "female";
  birthDate?: string;
  school?: string;
  about?: string;
}

interface UserContextType {
  user: UserData;
  setUser: (user: UserData) => void;
  updateUser: (updates: Partial<UserData>) => Promise<void>;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const createEmptyUser = (): UserData => ({
  name: "User",
  email: "",
  isVerified: false,
  loginMethod: null,
  joinDate: new Date().toISOString(),
});

const mapStoredUser = (user: User): UserData => ({
  id: user.id,
  barcode: user.barcode,
  name: user.name || "User",
  email: user.email || "",
  phone: user.phone || "",
  password: user.password,
  isVerified: Boolean(user.isVerified),
  loginMethod: user.loginMethod || null,
  profilePhoto: user.photoUri,
  joinDate:
    typeof user.createdAt === "number"
      ? new Date(user.createdAt).toISOString()
      : user.createdAt,
  age: user.age,
  height: user.height,
  weight: user.weight,
  gender: user.gender,
  birthDate: user.birthDate,
  school: user.school,
  about: user.about,
});

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserData>(createEmptyUser());
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const storedUser = await AuthenticationService.getCurrentUser();
    setUser(storedUser ? mapStoredUser(storedUser) : createEmptyUser());
  }, []);

  useEffect(() => {
    const initialize = async () => {
      try {
        await AuthenticationService.initialize();
        await SessionManager.initialize();
        await refreshUser();
      } finally {
        setIsLoading(false);
      }
    };

    initialize();

    return () => {
      SessionManager.cleanup();
    };
  }, [refreshUser]);

  const updateUser = async (updates: Partial<UserData>) => {
    setUser((current) => ({ ...current, ...updates }));

    if (!user.id) {
      return;
    }

    await UserProfileService.updateProfile(user.id, {
      name: updates.name,
      email: updates.email,
      phone: updates.phone,
      password: updates.password,
      age: updates.age,
      height: updates.height,
      weight: updates.weight,
      gender: updates.gender,
      birthDate: updates.birthDate,
      school: updates.school,
      about: updates.about,
      isVerified: updates.isVerified,
      loginMethod: updates.loginMethod,
    });
    await refreshUser();
  };

  const logout = async () => {
    await SessionManager.endSession();
    await AuthenticationService.logout();
    setUser(createEmptyUser());
  };

  return (
    <UserContext.Provider
      value={{ user, setUser, updateUser, refreshUser, logout, isLoading }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within UserProvider");
  }
  return context;
};
