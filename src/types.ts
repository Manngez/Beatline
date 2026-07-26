export type SongCategory = "mixed" | "pop" | "swedish" | "rap" | "rock";
export type GameContentMode = "music" | "history";
export type HistoryCategory = "all" | "world" | "sweden" | "science" | "culture" | "sport" | "society";

export interface Song {
  id: string;
  title: string;
  artist: string;
  year: number;
  decade: string;
  category: Exclude<SongCategory, "mixed">;
  contentType?: GameContentMode;
  summary?: string;
  historyCategory?: Exclude<HistoryCategory, "all">;
  icon?: string;
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
  contentMode: GameContentMode;
  historyCategory: HistoryCategory;
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
    description: "Alla musikgenrer och årtionden i en stor blandning",
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

export const HISTORY_CATEGORY_META: Record<
  HistoryCategory,
  { label: string; emoji: string; description: string; color: string }
> = {
  all: { label: "Blandad historia", emoji: "🌍", description: "Världshändelser, Sverige, vetenskap, kultur och sport", color: "#f59e0b" },
  world: { label: "Världen", emoji: "🏛️", description: "Politik, konflikter, ekonomi och internationella händelser", color: "#ef4444" },
  sweden: { label: "Sverige", emoji: "🇸🇪", description: "Viktiga svenska händelser från 1900 och framåt", color: "#38bdf8" },
  science: { label: "Vetenskap & teknik", emoji: "🚀", description: "Upptäckter, medicin, rymdfart och tekniska genombrott", color: "#8b5cf6" },
  culture: { label: "Kultur", emoji: "🎬", description: "Film, medier, konst och populärkultur", color: "#ec4899" },
  sport: { label: "Sport", emoji: "🏅", description: "Minnesvärda tävlingar och idrottsögonblick", color: "#22c55e" },
  society: { label: "Samhälle", emoji: "✊", description: "Rättigheter, miljö, katastrofer och samhällsförändringar", color: "#14b8a6" },
};