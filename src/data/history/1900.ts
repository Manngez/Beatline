import type { Song } from "../../types";
import { HISTORY_EXPANSION_EVENTS } from "./expansion";

export const HISTORY_1900_ADDITIONS: Song[] = [
  {
    id: "history-1900-paris-olympics",
    title: "De olympiska spelen hålls i Paris",
    artist: "Sport",
    year: 1900,
    decade: "1900-talet",
    category: "pop",
    contentType: "history",
    summary: "Paris står värd för den andra moderna olympiaden. Tävlingarna arrangeras i samband med världsutställningen och pågår under flera månader.",
    historyCategory: "sport",
    icon: "🏅",
  },
  {
    id: "history-1900-zeppelin-first-flight",
    title: "Det första Zeppelin-luftskeppet flyger",
    artist: "Vetenskap & teknik",
    year: 1900,
    decade: "1900-talet",
    category: "pop",
    contentType: "history",
    summary: "LZ 1 genomför sin första flygning över Bodensjön. Försöket blir början på Zeppelin-luftskeppens epok.",
    historyCategory: "science",
    icon: "🎈",
  },
  {
    id: "history-1900-boxer-protocol-crisis",
    title: "Åttanationsalliansen intar Peking",
    artist: "Världshistoria",
    year: 1900,
    decade: "1900-talet",
    category: "pop",
    contentType: "history",
    summary: "En internationell militärstyrka går in i Peking under Boxarupproret och bryter belägringen av legationskvarteren.",
    historyCategory: "world",
    icon: "⚔️",
  },
  ...HISTORY_EXPANSION_EVENTS.filter(
    (event) => !event.title.startsWith("Sverige vinner Eurovision med Diggi-loo"),
  ),
];
