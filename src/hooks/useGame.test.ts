import { describe, expect, it, vi } from "vitest";
import type { GameState, Player, Song } from "../types";
import { gameReducer, isValidPlacement } from "./useGame";

vi.mock("../utils/sounds", () => ({
  playBankSound: vi.fn(),
  playSuccessSound: vi.fn(),
  playWinSound: vi.fn(),
  playWrongSound: vi.fn(),
}));

const song = (id: string, year: number): Song => ({
  id,
  title: id,
  artist: "Test",
  year,
  decade: `${Math.floor(year / 10) * 10}-tal`,
  category: "pop",
});

const player = (id: string, timeline: Song[], tokens = 2): Player => ({
  id,
  name: id,
  color: "#fff",
  timeline,
  tokens,
});

const listeningState = (overrides: Partial<GameState> = {}): GameState => {
  const base = song("base", 2000);
  return {
    phase: "listening",
    players: [player("stable-a", [base]), player("stable-b", [song("b", 1990)])],
    deck: [song("next", 2010)],
    currentPlayerIndex: 0,
    currentSong: song("guess", 2005),
    placementSlot: null,
    roundCards: [],
    workingTimeline: [base],
    useTokens: true,
    category: "mixed",
    winnerId: null,
    message: "",
    lastResult: null,
    streak: 0,
    revealedSong: null,
    ...overrides,
  };
};

describe("isValidPlacement", () => {
  const timeline = [song("a", 1990), song("b", 2000)];

  it("accepts valid positions before, between and after cards", () => {
    expect(isValidPlacement(timeline, song("x", 1980), 0)).toBe(true);
    expect(isValidPlacement(timeline, song("x", 1995), 1)).toBe(true);
    expect(isValidPlacement(timeline, song("x", 2010), 2)).toBe(true);
  });

  it("accepts songs with the same year on either adjacent slot", () => {
    expect(isValidPlacement(timeline, song("x", 2000), 1)).toBe(true);
    expect(isValidPlacement(timeline, song("x", 2000), 2)).toBe(true);
  });

  it("rejects negative, fractional and out-of-range positions", () => {
    expect(isValidPlacement(timeline, song("x", 1995), -1)).toBe(false);
    expect(isValidPlacement(timeline, song("x", 1995), 1.5)).toBe(false);
    expect(isValidPlacement(timeline, song("x", 1995), 3)).toBe(false);
  });
});

describe("gameReducer", () => {
  it("ignores an invalid placement action without changing state", () => {
    const state = listeningState();
    expect(gameReducer(state, { type: "PLACE_CARD", slotIndex: 99 })).toBe(state);
  });

  it("clears the current round pot after a wrong answer", () => {
    const safe = song("safe", 2000);
    const potCard = song("pot", 2005);
    const state = listeningState({
      currentSong: song("wrong", 1980),
      roundCards: [potCard],
      workingTimeline: [safe, potCard],
      streak: 1,
    });
    const next = gameReducer(state, { type: "PLACE_CARD", slotIndex: 2 });
    expect(next.lastResult).toBe("wrong");
    expect(next.roundCards).toEqual([]);
    expect(next.workingTimeline).toEqual(state.players[0].timeline);
  });

  it("banks cards, awards a streak token and ends the turn", () => {
    const banked = song("banked", 2000);
    const earned = song("earned", 2005);
    const state = listeningState({
      phase: "result",
      currentSong: null,
      players: [player("stable-a", [banked], 2), player("stable-b", [song("b", 1990)])],
      workingTimeline: [banked, earned],
      roundCards: [earned],
      lastResult: "correct",
      streak: 3,
      revealedSong: earned,
    });
    const next = gameReducer(state, { type: "BANK_AND_END" });
    expect(next.players[0].timeline).toEqual([banked, earned]);
    expect(next.players[0].tokens).toBe(3);
    expect(next.currentPlayerIndex).toBe(1);
  });

  it("declares a winner when banking the tenth card", () => {
    const nine = Array.from({ length: 9 }, (_, index) => song(`s${index}`, 1980 + index));
    const tenth = song("tenth", 2000);
    const state = listeningState({
      phase: "result",
      currentSong: null,
      players: [player("stable-a", nine), player("stable-b", [song("b", 1970)])],
      workingTimeline: [...nine, tenth],
      roundCards: [tenth],
      lastResult: "correct",
      streak: 1,
      revealedSong: tenth,
    });
    const next = gameReducer(state, { type: "BANK_AND_END" });
    expect(next.phase).toBe("game-over");
    expect(next.winnerId).toBe("stable-a");
  });

  it("keeps stable player IDs throughout a turn transition", () => {
    const state = listeningState({
      phase: "result",
      currentSong: null,
      lastResult: "wrong",
      revealedSong: song("wrong", 1980),
    });
    const next = gameReducer(state, { type: "BANK_AND_END" });
    expect(next.players.map((item) => item.id)).toEqual(["stable-a", "stable-b"]);
    expect(next.currentPlayerIndex).toBe(1);
  });
});
