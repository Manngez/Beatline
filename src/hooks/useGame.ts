import { useCallback, useReducer } from "react";
import { getSongsForCategory, shuffleDeck } from "../data/songs";
import {
  CARDS_TO_WIN,
  MAX_TOKENS,
  PLAYER_COLORS,
  STARTING_TOKENS,
  type GameState,
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

type Action =
  | { type: "START_GAME"; names: string[]; useTokens: boolean; category: SongCategory }
  | { type: "PLACE_CARD"; slotIndex: number }
  | { type: "CONTINUE_ROUND" }
  | { type: "BANK_AND_END" }
  | { type: "SKIP_SONG" }
  | { type: "REDRAW_AUDIO_FAIL" }
  | { type: "SET_REMOTE_STATE"; state: GameState }
  | { type: "RESET" };

function isValidPlacement(timeline: Song[], song: Song, slotIndex: number): boolean {
  const left = slotIndex > 0 ? timeline[slotIndex - 1] : null;
  const right = slotIndex < timeline.length ? timeline[slotIndex] : null;
  if (left && song.year < left.year) return false;
  if (right && song.year > right.year) return false;
  return true;
}

function insertAt(timeline: Song[], song: Song, slotIndex: number): Song[] {
  return [...timeline.slice(0, slotIndex), song, ...timeline.slice(slotIndex)];
}

function getInitialState(): GameState {
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
  return players.find((p) => p.timeline.length >= CARDS_TO_WIN) ?? null;
}

function bestPlayer(players: Player[]): Player {
  return players.reduce((a, b) => (b.timeline.length > a.timeline.length ? b : a));
}

function startPlayerTurn(players: Player[], playerIndex: number, deck: Song[], useTokens: boolean): Partial<GameState> {
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
      message: `Korten är slut! ${winner.name} vinner med ${winner.timeline.length} hits!`,
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
    message: `${player.name}s tur – lyssna, placera och pressa lyckan!`,
    useTokens,
  };
}

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "SET_REMOTE_STATE":
      return action.state;
    case "START_GAME": {
      const deck = shuffleDeck(getSongsForCategory(action.category));
      const players: Player[] = action.names.map((name, i) => ({
        id: `p${i}`,
        name: name.trim() || `Spelare ${i + 1}`,
        color: PLAYER_COLORS[i % PLAYER_COLORS.length],
        timeline: [deck.shift()!],
        tokens: action.useTokens ? STARTING_TOKENS : 0,
      }));
      let startIdx = 0;
      players.forEach((p, i) => {
        if (p.timeline[0].year < players[startIdx].timeline[0].year) startIdx = i;
      });
      return { ...getInitialState(), players, category: action.category, ...startPlayerTurn(players, startIdx, deck, action.useTokens), useTokens: action.useTokens } as GameState;
    }
    case "PLACE_CARD": {
      if (state.phase !== "listening" || !state.currentSong) return state;
      const song = state.currentSong;
      const correct = isValidPlacement(state.workingTimeline, song, action.slotIndex);
      if (correct) {
        playSuccessSound();
        const workingTimeline = insertAt(state.workingTimeline, song, action.slotIndex);
        const roundCards = [...state.roundCards, song];
        const streak = state.streak + 1;
        return { ...state, phase: "result", placementSlot: action.slotIndex, workingTimeline, roundCards, streak, lastResult: "correct", revealedSong: song, currentSong: null, message: streak === 1 ? `Rätt! ${song.title} (${song.year}). Fortsätt eller stanna?` : `Rätt igen! Streak ×${streak}. ${song.title} (${song.year}). Riskera mer eller banka?` };
      }
      playWrongSound();
      const lost = state.roundCards.length;
      return { ...state, phase: "result", placementSlot: action.slotIndex, lastResult: "wrong", revealedSong: song, currentSong: null, roundCards: [], workingTimeline: [...state.players[state.currentPlayerIndex].timeline], streak: 0, message: lost > 0 ? `Fel! ${song.title} är från ${song.year}. Du förlorar ${lost} rundkort!` : `Fel! ${song.title} är från ${song.year}. Rundan är över.` };
    }
    case "CONTINUE_ROUND": {
      if (state.phase !== "result" || state.lastResult !== "correct") return state;
      const drawn = drawSong(state.deck);
      if (!drawn.song) {
        const players = state.players.map((p, i) => i === state.currentPlayerIndex ? { ...p, timeline: [...state.workingTimeline] } : p);
        const winner = checkWinner(players) ?? bestPlayer(players);
        playWinSound();
        return { ...state, players, phase: "game-over", winnerId: winner.id, deck: [], message: `Korten är slut! ${winner.name} vinner!` };
      }
      return { ...state, phase: "listening", currentSong: drawn.song, deck: drawn.deck, placementSlot: null, lastResult: null, revealedSong: null, message: `${state.players[state.currentPlayerIndex].name} fortsätter! ${state.roundCards.length} kort i potten.` };
    }
    case "BANK_AND_END": {
      if (state.phase !== "result") return state;
      const player = state.players[state.currentPlayerIndex];
      let players = state.players;
      if (state.lastResult === "correct") {
        playBankSound();
        players = state.players.map((p, i) => i === state.currentPlayerIndex ? { ...p, timeline: [...state.workingTimeline], tokens: state.useTokens ? Math.min(MAX_TOKENS, p.tokens + (state.streak >= 3 ? 1 : 0)) : p.tokens } : p);
        const winner = checkWinner(players);
        if (winner) {
          playWinSound();
          return { ...state, players, phase: "game-over", winnerId: winner.id, message: `🎉 ${winner.name} bankade till ${winner.timeline.length} hits och vinner!`, roundCards: [] };
        }
      }
      const nextIndex = (state.currentPlayerIndex + 1) % players.length;
      const turn = startPlayerTurn(players, nextIndex, state.deck, state.useTokens);
      return { ...state, players, ...turn, message: state.lastResult === "correct" ? `${player.name} bankade ${state.roundCards.length} kort! ${turn.message ?? ""}` : `${player.name}s runda slut. ${turn.message ?? ""}` } as GameState;
    }
    case "SKIP_SONG": {
      const player = state.players[state.currentPlayerIndex];
      if (!state.useTokens || player.tokens < 1 || state.phase !== "listening") return state;
      if (state.deck.length === 0) return { ...state, message: "Inga fler kort att byta till!" };
      const players = state.players.map((p, i) => i === state.currentPlayerIndex ? { ...p, tokens: p.tokens - 1 } : p);
      const drawn = drawSong(state.deck);
      return { ...state, players, currentSong: drawn.song, deck: drawn.deck, placementSlot: null, message: `${player.name} hoppade över låten (1 token).` };
    }
    case "REDRAW_AUDIO_FAIL": {
      if (state.phase !== "listening") return state;
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
  const [state, dispatch] = useReducer(reducer, undefined, getInitialState);
  const startGame = useCallback((names: string[], useTokens: boolean, category: SongCategory) => dispatch({ type: "START_GAME", names, useTokens, category }), []);
  const placeCard = useCallback((slotIndex: number) => dispatch({ type: "PLACE_CARD", slotIndex }), []);
  const continueRound = useCallback(() => dispatch({ type: "CONTINUE_ROUND" }), []);
  const bankAndEnd = useCallback(() => dispatch({ type: "BANK_AND_END" }), []);
  const skipSong = useCallback(() => dispatch({ type: "SKIP_SONG" }), []);
  const redrawAudioFail = useCallback(() => dispatch({ type: "REDRAW_AUDIO_FAIL" }), []);
  const setRemoteState = useCallback((remoteState: GameState) => dispatch({ type: "SET_REMOTE_STATE", state: remoteState }), []);
  const reset = useCallback(() => dispatch({ type: "RESET" }), []);
  return { state, startGame, placeCard, continueRound, bankAndEnd, skipSong, redrawAudioFail, setRemoteState, reset };
}
