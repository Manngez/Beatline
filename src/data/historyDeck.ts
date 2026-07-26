import type { Song } from "../types";

/**
 * Builds a history deck where each year can appear at most once.
 *
 * The input may contain several cards for the same year. One card is selected
 * randomly from every year group, then the selected cards are shuffled. This
 * keeps four-per-year databases varied without allowing duplicate years in a
 * single game.
 */
export function buildUniqueYearHistoryDeck(events: Song[]): Song[] {
  const eventsByYear = new Map<number, Song[]>();

  for (const event of events) {
    const group = eventsByYear.get(event.year) ?? [];
    group.push(event);
    eventsByYear.set(event.year, group);
  }

  const selected = [...eventsByYear.values()].map((group) => {
    const index = Math.floor(Math.random() * group.length);
    return group[index];
  });

  for (let index = selected.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [selected[index], selected[swapIndex]] = [selected[swapIndex], selected[index]];
  }

  return selected;
}
