import React, {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import LocalDatabaseService from "../services/LocalDatabaseService";
import type { PlayerProfile, ProfileInput } from "../types/localProfiles";

const GUEST_MODE_KEY = "guest_mode";
const TERMS_ACCEPTED_KEY = "terms_accepted";

type ProfileContextValue = {
  profiles: PlayerProfile[];
  activeProfile: PlayerProfile | null;
  isGuest: boolean;
  termsAccepted: boolean;
  isLoading: boolean;
  error: string | null;
  refreshProfiles: () => Promise<void>;
  createProfile: (input: ProfileInput) => Promise<PlayerProfile>;
  updateProfile: (profileId: string, input: ProfileInput) => Promise<void>;
  deleteProfile: (profileId: string) => Promise<void>;
  selectProfile: (profile: PlayerProfile) => Promise<void>;
  enterGuestMode: () => Promise<void>;
  acceptTerms: () => Promise<void>;
};

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

const errorMessage = (error: unknown) =>
  error instanceof Error
    ? error.message
    : "Penyimpanan lokal gagal. Silakan coba lagi.";

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profiles, setProfiles] = useState<PlayerProfile[]>([]);
  const [activeProfile, setActiveProfile] = useState<PlayerProfile | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshProfiles = useCallback(async () => {
    const nextProfiles = await LocalDatabaseService.listProfiles();
    setProfiles(nextProfiles);
    setActiveProfile((current) =>
      current ? nextProfiles.find((profile) => profile.id === current.id) ?? null : null,
    );
  }, []);

  useEffect(() => {
    const initialize = async () => {
      try {
        await LocalDatabaseService.initialize();
        const [nextProfiles, lastProfileId, guestMode, terms] = await Promise.all([
          LocalDatabaseService.listProfiles(),
          LocalDatabaseService.getLastProfileId(),
          LocalDatabaseService.getSetting(GUEST_MODE_KEY),
          LocalDatabaseService.getSetting(TERMS_ACCEPTED_KEY),
        ]);
        const guest = guestMode === "1";
        setProfiles(nextProfiles);
        setIsGuest(guest);
        setTermsAccepted(terms === "1");
        setActiveProfile(
          guest
            ? null
            : nextProfiles.find((profile) => profile.id === lastProfileId) ?? null,
        );
      } catch (initializationError) {
        setError(errorMessage(initializationError));
      } finally {
        setIsLoading(false);
      }
    };
    initialize();
  }, []);

  const createProfile = async (input: ProfileInput) => {
    try {
      setError(null);
      const profile = await LocalDatabaseService.createProfile(input);
      await LocalDatabaseService.setLastProfileId(profile.id);
      await LocalDatabaseService.setSetting(GUEST_MODE_KEY, "0");
      setProfiles((current) => [...current, profile]);
      setActiveProfile(profile);
      setIsGuest(false);
      return profile;
    } catch (createError) {
      const message = errorMessage(createError);
      setError(message);
      throw new Error(message);
    }
  };

  const updateProfile = async (
    profileId: string,
    input: ProfileInput,
  ) => {
    try {
      setError(null);
      await LocalDatabaseService.updateProfile(profileId, input);
      await refreshProfiles();
    } catch (updateError) {
      const message = errorMessage(updateError);
      setError(message);
      throw new Error(message);
    }
  };

  const deleteProfile = async (profileId: string) => {
    try {
      setError(null);
      await LocalDatabaseService.deleteProfile(profileId);
      if (activeProfile?.id === profileId) setActiveProfile(null);
      await refreshProfiles();
    } catch (deleteError) {
      const message = errorMessage(deleteError);
      setError(message);
      throw new Error(message);
    }
  };

  const selectProfile = async (profile: PlayerProfile) => {
    try {
      setError(null);
      await LocalDatabaseService.setLastProfileId(profile.id);
      await LocalDatabaseService.setSetting(GUEST_MODE_KEY, "0");
      setActiveProfile(profile);
      setIsGuest(false);
    } catch (selectionError) {
      const message = errorMessage(selectionError);
      setError(message);
      throw new Error(message);
    }
  };

  const enterGuestMode = async () => {
    try {
      setError(null);
      await LocalDatabaseService.setSetting(GUEST_MODE_KEY, "1");
      setActiveProfile(null);
      setIsGuest(true);
    } catch (guestError) {
      const message = errorMessage(guestError);
      setError(message);
      throw new Error(message);
    }
  };

  const acceptTerms = async () => {
    await LocalDatabaseService.setSetting(TERMS_ACCEPTED_KEY, "1");
    setTermsAccepted(true);
  };

  const value = {
    profiles,
    activeProfile,
    isGuest,
    termsAccepted,
    isLoading,
    error,
    refreshProfiles,
    createProfile,
    updateProfile,
    deleteProfile,
    selectProfile,
    enterGuestMode,
    acceptTerms,
  };

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export const useProfiles = () => {
  const context = useContext(ProfileContext);
  if (!context) throw new Error("useProfiles must be used within ProfileProvider");
  return context;
};
