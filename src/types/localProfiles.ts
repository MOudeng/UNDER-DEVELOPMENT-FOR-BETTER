export interface PlayerProfile {
  id: string;
  displayName: string;
  avatarId: AvatarId;
  /** Photo from the gallery or camera. Shown instead of the icon when set. */
  avatarUri: string | null;
  age: number | null;
  schoolName: string | null;
  createdAt: number;
}

export type ProfileInput = {
  displayName: string;
  avatarId: AvatarId;
  avatarUri?: string | null;
  age?: number | null;
  schoolName?: string | null;
};

export interface LocalGameSession {
  id: string;
  profileId: string;
  gameMode: "test" | "practice" | "legacy";
  startedAt: number;
  finishedAt: number | null;
  totalDurationMs: number;
  completedPatterns: number;
  verificationMethod: string;
  patternSetId: string | null;
  sessionStatus: "in_progress" | "completed" | "partial";
}

export interface LocalPatternResult {
  id: string;
  sessionId: string;
  patternId: string;
  levelNumber: number | null;
  patternVariant: string | null;
  durationMs: number;
  completionStatus: "completed" | "skipped" | "failed";
}

export type SessionWithPatterns = LocalGameSession & {
  patterns: LocalPatternResult[];
};

export interface ProfileStatistics {
  completedSessions: number;
  fastestDurationMs: number | null;
  averageDurationMs: number | null;
}

export const PROFILE_AVATARS = [
  { id: "rocket", emoji: "🚀", label: "Roket" },
  { id: "star", emoji: "⭐", label: "Bintang" },
  { id: "puzzle", emoji: "🧩", label: "Puzzle" },
  { id: "robot", emoji: "🤖", label: "Robot" },
  { id: "cat", emoji: "🐱", label: "Kucing" },
  { id: "fox", emoji: "🦊", label: "Rubah" },
  { id: "dog", emoji: "🐶", label: "Anjing" },
  { id: "rabbit", emoji: "🐰", label: "Kelinci" },
  { id: "bear", emoji: "🐻", label: "Beruang" },
  { id: "panda", emoji: "🐼", label: "Panda" },
  { id: "koala", emoji: "🐨", label: "Koala" },
  { id: "tiger", emoji: "🐯", label: "Harimau" },
  { id: "lion", emoji: "🦁", label: "Singa" },
  { id: "cow", emoji: "🐮", label: "Sapi" },
  { id: "pig", emoji: "🐷", label: "Babi" },
  { id: "frog", emoji: "🐸", label: "Katak" },
  { id: "monkey", emoji: "🐵", label: "Monyet" },
  { id: "chick", emoji: "🐥", label: "Anak ayam" },
  { id: "penguin", emoji: "🐧", label: "Penguin" },
  { id: "owl", emoji: "🦉", label: "Burung hantu" },
  { id: "butterfly", emoji: "🦋", label: "Kupu-kupu" },
  { id: "bee", emoji: "🐝", label: "Lebah" },
  { id: "turtle", emoji: "🐢", label: "Kura-kura" },
  { id: "fish", emoji: "🐠", label: "Ikan" },
  { id: "dolphin", emoji: "🐬", label: "Lumba-lumba" },
  { id: "whale", emoji: "🐳", label: "Paus" },
  { id: "unicorn", emoji: "🦄", label: "Unicorn" },
  { id: "dragon", emoji: "🐲", label: "Naga" },
  { id: "sun", emoji: "🌞", label: "Matahari" },
  { id: "moon", emoji: "🌙", label: "Bulan" },
  { id: "rainbow", emoji: "🌈", label: "Pelangi" },
  { id: "flower", emoji: "🌸", label: "Bunga" },
  { id: "tree", emoji: "🌳", label: "Pohon" },
  { id: "mushroom", emoji: "🍄", label: "Jamur" },
  { id: "apple", emoji: "🍎", label: "Apel" },
  { id: "strawberry", emoji: "🍓", label: "Stroberi" },
  { id: "watermelon", emoji: "🍉", label: "Semangka" },
  { id: "donut", emoji: "🍩", label: "Donat" },
  { id: "icecream", emoji: "🍦", label: "Es krim" },
  { id: "soccer", emoji: "⚽", label: "Bola" },
  { id: "basketball", emoji: "🏀", label: "Basket" },
  { id: "guitar", emoji: "🎸", label: "Gitar" },
  { id: "palette", emoji: "🎨", label: "Palet" },
  { id: "trophy", emoji: "🏆", label: "Piala" },
  { id: "crown", emoji: "👑", label: "Mahkota" },
  { id: "gem", emoji: "💎", label: "Permata" },
  { id: "balloon", emoji: "🎈", label: "Balon" },
  { id: "gift", emoji: "🎁", label: "Hadiah" },
  { id: "books", emoji: "📚", label: "Buku" },
  { id: "car", emoji: "🚗", label: "Mobil" },
] as const;

export type AvatarId = (typeof PROFILE_AVATARS)[number]["id"];

export const getAvatarEmoji = (avatarId: string) =>
  PROFILE_AVATARS.find((avatar) => avatar.id === avatarId)?.emoji ?? "🧩";
