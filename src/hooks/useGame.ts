import { useCallback, useReducer } from "react";
import { getHistoryEvents } from "../data/history";
import { buildUniqueYearHistoryDeck } from "../data/historyDeck";
import { getSongsForCategory, shuffleDeck } from "../data/songs";
import {
  CARDS_TO_WIN,
  MAX_TOKENS,
  PLAYER_COLORS,
  STARTING_TOKENS,
  type GameContentMode,
  type GameState,
  type HistoryCategory,
  type Player,
  type Song,
  type SongCategory,
} from "../types";
import {
  playBankSound,
  playSuccessSound,
  playWinSound,
  playWrongSound,
} from "../utils/sounds";

export type GamePlayerInput = { id: string; name: string };

export type GameAction =
  | { type: "START_GAME"; players: GamePlayerInput[]; useTokens: boolean; category: SongCategory; contentMode: GameContentMode; historyCategory: HistoryCategory }
  | { type: "PLACE_CARD"; slotIndex: number }
  | { type: "CONTINUE_ROUND" }
  | { type: "BANK_AND_END" }
  | { type: "SKIP_SONG" }
  | { type: "REDRAW_AUDIO_FAIL" }
  | { type: "SET_REMOTE_STATE"; state: GameState }
  | { type: "RESET" };

export function isValidPlacement(timeline: Song[], song: Song, slotIndex: number): boolean {
  if (!Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex > timeline.length) return false;
  const left = slotIndex > 0 ? timeline[slotIndex - 1] : null;
  const right = slotIndex < timeline.length ? timeline[slotIndex] : null;
  if (left && song.year < left.year) return false;
  if (right && song.year > right.year) return false;
  return true;
}

function insertAt(timeline: Song[], song: Song, slotIndex: number): Song[] {
  return [...timeline.slice(0, slotIndex), song, ...timeline.slice(slotIndex)];
}

export function getInitialState(): GameState {
  return {
    phase: "setup",
    players: [],
    deck: [],
    currentPlayerIndex: 0,
    currentSong: null,
    placementSlot: null,
    roundCards: [],
    workingTimeline: [],
    useTokens: true,
    category: "mixed",
    contentMode: "music",
    historyCategory: "all",
    winnerId: null,
    message: "",
    lastResult: null,
    streak: 0,
    revealedSong: null,
  };
}

function drawSong(deck: Song[]): { song: Song | null; deck: Song[] } {
  if (deck.length === 0) return { song: null, deck };
  const [song, ...rest] = deck;
  return { song, deck: rest };
}

function checkWinner(players: Player[]): Player | null {
  return players.find((player) => player.timeline.length >= CARDS_TO_WIN) ?? null;
}

function bestPlayer(players: Player[]): Player {
  return players.reduce((a, b) => (b.timeline.length > a.timeline.length ? b : a));
}

function contentNoun(mode: GameContentMode) {
  return mode === "history" ? "händelsen" : "låten";
}

function startPlayerTurn(players: Player[], playerIndex: number, deck: Song[], useTokens: boolean, contentMode: GameContentMode): Partial<GameState> {
  const player = players[playerIndex];
  const drawn = drawSong(deck);
  if (!drawn.song) {
    const winner = bestPlayer(players);
    return {
      phase: "game-over",
      winnerId: winner.id,
      currentSong: null,
      deck: [],
      roundCards: [],
      workingTimeline: [...player.timeline],
      message: `Korten är slut! ${winner.name} vinner med ${winner.timeline.length} träffar!`,
    };
  }
  return {
    phase: "listening",
    currentPlayerIndex: playerIndex,
    currentSong: drawn.song,
    deck: drawn.deck,
    placementSlot: null,
    roundCards: [],
    workingTimeline: [...player.timeline],
    lastResult: null,
    streak: 0,
    revealedSong: null,
    message: contentMode === "history"
      ? `${player.name}s tur – placera händelsen på tidslinjen!`
      : `${player.name}s tur – lyssna, placera och pressa lyckan!`,
    useTokens,
  };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "SET_REMOTE_STATE": {
      const incoming = action.state;
      const isNewResult = incoming.phase === "result" && (state.phase !== "result" || state.revealedSong?.id !== incoming.revealedSong?.id);
      if (isNewResult) {
        if (incoming.lastResult === "correct") playSuccessSound();
        if (incoming.lastResult === "wrong") playWrongSound();
      }
      return incoming;
    }
    case "START_GAME": {
      const source = action.contentMode === "history" ? getHistoryEvents(action.historyCategory) : getSongsForCategory(action.category);
      const deck = action.contentMode === "history" ? buildUniqueYearHistoryDeck(source) : shuffleDeck(source);
      if (action.players.length === 0 || deck.length < action.players.length + 1) return state;
      const players: Player[] = action.players.map((input, index) => ({
        id: input.id,
        name: input.name.trim() || `Spelare ${index + 1}`,
        color: PLAYER_COLORS[index % PLAYER_COLORS.length],
        timeline: [deck.shift()!],
        tokens: action.useTokens ? STARTING_TOKENS : 0,
      }));
      let startIndex = 0;
      players.forEach((player, index) => {
        if (player.timeline[0].year < players[startIndex].timeline[0].year) startIndex = index;
      });
      return {
        ...getInitialState(),
        players,
        category: action.category,
        contentMode: action.contentMode,
        historyCategory: action.historyCategory,
        ...startPlayerTurn(players, startIndex, deck, action.useTokens, action.contentMode),
        useTokens: action.useTokens,
      } as GameState;
    }
    case "PLACE_CARD": {
      if (state.phase !== "listening" || !state.currentSong) return state;
      if (!Number.isInteger(action.slotIndex) || action.slotIndex < 0 || action.slotIndex > state.workingTimeline.length) return state;
      const song = state.currentSong;
      const correct = isValidPlacement(state.workingTimeline, song, action.slotIndex);
      if (correct) {
        playSuccessSound();
        const workingTimeline = insertAt(state.workingTimeline, song, action.slotIndex);
        const roundCards = [...state.roundCards, song];
        const streak = state.streak + 1;
        return {
          ...state,
          phase: "result",
          placementSlot: action.slotIndex,
          workingTimeline,
          roundCards,
          streak,
          lastResult: "correct",
          revealedSong: song,
          currentSong: null,
          message: streak === 1
            ? `Rätt! ${song.title} (${song.year}). Fortsätt eller stanna?`
            : `Rätt igen! Streak ×${streak}. ${song.title} (${song.year}). Riskera mer eller banka?`,
        };
      }
      playWrongSound();
      const lost = state.roundCards.length;
      return {
        ...state,
        phase: "result",
        placementSlot: action.slotIndex,
        lastResult: "wrong",
        revealedSong: song,
        currentSong: null,
        roundCards: [],
        workingTimeline: [...state.players[state.currentPlayerIndex].timeline],
        streak: 0,
        message: lost > 0
          ? `Fel! ${song.title} är från ${song.year}. Du förlorar ${lost} rundkort!`
          : `Fel! ${song.title} är från ${song.year}. Rundan är över.`,
      };
    }
    case "CONTINUE_ROUND": {
      if (state.phase !== "result" || state.lastResult !== "correct") return state;
      const drawn = drawSong(state.deck);
      if (!drawn.song) {
        const players = state.players.map((player, index) => index === state.currentPlayerIndex ? { ...player, timeline: [...state.workingTimeline] } : player);
        const winner = checkWinner(players) ?? bestPlayer(players);
        playWinSound();
        return { ...state, players, phase: "game-over", winnerId: winner.id, deck: [], message: `Korten är slut! ${winner.name} vinner!` };
      }
      return {
        ...state,
        phase: "listening",
        currentSong: drawn.song,
        deck: drawn.deck,
        placementSlot: null,
        lastResult: null,
        revealedSong: null,
        message: `${state.players[state.currentPlayerIndex].name} fortsätter! ${state.roundCards.length} kort i potten. Placera ${contentNoun(state.contentMode)}.`,
      };
    }
    case "BANK_AND_END": {
      if (state.phase !== "result") return state;
      const player = state.players[state.currentPlayerIndex];
      let players = state.players;
      if (state.lastResult === "correct") {
        playBankSound();
        players = state.players.map((item, index) => index === state.currentPlayerIndex
          ? { ...item, timeline: [...state.workingTimeline], tokens: state.useTokens ? Math.min(MAX_TOKENS, item.tokens + (state.streak >= 3 ? 1 : 0)) : item.tokens }
          : item);
        const winner = checkWinner(players);
        if (winner) {
          playWinSound();
          return { ...state, players, phase: "game-over", winnerId: winner.id, message: `🎉 ${winner.name} bankade till ${winner.timeline.length} träffar och vinner!`, roundCards: [] };
        }
      }
      const nextIndex = (state.currentPlayerIndex + 1) % players.length;
      const turn = startPlayerTurn(players, nextIndex, state.deck, state.useTokens, state.contentMode);
      return { ...state, players, ...turn, message: state.lastResult === "correct" ? `${player.name} bankade ${state.roundCards.length} kort! ${turn.message ?? ""}` : `${player.name}s runda slut. ${turn.message ?? ""}` } as GameState;
    }
    case "SKIP_SONG": {
      const player = state.players[state.currentPlayerIndex];
      if (!player || !state.useTokens || player.tokens < 1 || state.phase !== "listening") return state;
      if (state.deck.length === 0) return { ...state, message: "Inga fler kort att byta till!" };
      const players = state.players.map((item, index) => index === state.currentPlayerIndex ? { ...item, tokens: item.tokens - 1 } : item);
      const drawn = drawSong(state.deck);
      return { ...state, players, currentSong: drawn.song, deck: drawn.deck, placementSlot: null, message: `${player.name} hoppade över ${contentNoun(state.contentMode)} (1 token).` };
    }
    case "REDRAW_AUDIO_FAIL": {
      if (state.contentMode !== "music" || state.phase !== "listening") return state;
      if (state.deck.length === 0) return { ...state, message: "Inga fler kort i leken att byta till!" };
      const drawn = drawSong(state.deck);
      const player = state.players[state.currentPlayerIndex];
      return { ...state, currentSong: drawn.song, deck: drawn.deck, placementSlot: null, message: `Ljudfel – nytt kort till ${player.name} (gratis).` };
    }
    case "RESET":
      return getInitialState();
    default:
      return state;
  }
}

export function useGame() {
  const [state, dispatch] = useReducer(gameReducer, undefined, getInitialState);
  const startGame = useCallback((names: string[], useTokens: boolean, category: SongCategory, ids?: string[], contentMode: GameContentMode = "music", historyCategory: HistoryCategory = "all") => dispatch({
    type: "START_GAME",
    players: names.map((name, index) => ({ id: ids?.[index] ?? `p${index}`, name })),
    useTokens,
    category,
    contentMode,
    historyCategory,
  }), []);
  const placeCard = useCallback((slotIndex: number) => dispatch({ type: "PLACE_CARD", slotIndex }), []);
  const continueRound = useCallback(() => dispatch({ type: "CONTINUE_ROUND" }), []);
  const bankAndEnd = useCallback(() => dispatch({ type: "BANK_AND_END" }), []);
  const skipSong = useCallback(() => dispatch({ type: "SKIP_SONG" }), []);
  const redrawAudioFail = useCallback(() => dispatch({ type: "REDRAW_AUDIO_FAIL" }), []);
  const setRemoteState = useCallback((remoteState: GameState) => dispatch({ type: "SET_REMOTE_STATE", state: remoteState }), []);
  const reset = useCallback(() => dispatch({ type: "RESET" }), []);
  return { state, startGame, placeCard, continueRound, bankAndEnd, skipSong, redrawAudioFail, setRemoteState, reset };
}