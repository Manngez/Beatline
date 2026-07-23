export type SongCategory = "mixed" | "pop" | "swedish" | "rap" | "rock";

export interface Song {
  id: string;
  title: string;
  artist: string;
  year: number;
  decade: string;
  category: Exclude<SongCategory, "mixed">;
}

export interface Player {
  id: string;
  name: string;
  color: string;
  /** Permanently banked cards */
  timeline: Song[];
  tokens: number;
}

export type GamePhase =
  | "setup"
  | "listening"
  | "result"
  | "game-over";

export interface GameState {
  phase: GamePhase;
  players: Player[];
  deck: Song[];
  currentPlayerIndex: number;
  currentSong: Song | null;
  placementSlot: number | null;
  /** Cards earned this turn (not yet banked) */
  roundCards: Song[];
  /** Working timeline for placement = banked + round cards */
  workingTimeline: Song[];
  useTokens: boolean;
  category: SongCategory;
  winnerId: string | null;
  message: string;
  lastResult: "correct" | "wrong" | null;
  streak: number;
  revealedSong: Song | null;
}

export const PLAYER_COLORS = [
  "#f43f5e",
  "#3b82f6",
  "#22c55e",
  "#f59e0b",
  "#a855f7",
  "#06b6d4",
];

export const CARDS_TO_WIN = 10;
export const MAX_TOKENS = 5;
export const STARTING_TOKENS = 2;

export const CATEGORY_META: Record<
  SongCategory,
  { label: string; emoji: string; description: string; color: string }
> = {
  mixed: {
    label: "Blandat",
    emoji: "🎲",
    description: "Alla genrer och årtionden i en stor blandning",
    color: "#e879f9",
  },
  pop: {
    label: "Pop",
    emoji: "🎤",
    description: "Pophits från 60-talet till idag",
    color: "#fb7185",
  },
  swedish: {
    label: "Svenska",
    emoji: "🇸🇪",
    description: "Svenska klassiker och moderna hits",
    color: "#38bdf8",
  },
  rap: {
    label: "Rap",
    emoji: "🎧",
    description: "Hiphop & rap från old school till nutid",
    color: "#fbbf24",
  },
  rock: {
    label: "Rock",
    emoji: "🎸",
    description: "Rock, metal och alternativ från alla tider",
    color: "#a3e635",
  },
};
