import { useMemo, useState } from "react";
import { getHistoryCategoryCounts } from "../data/history";
import { getCategoryCounts } from "../data/songs";
import {
  CATEGORY_META,
  HISTORY_CATEGORY_META,
  PLAYER_COLORS,
  type GameContentMode,
  type HistoryCategory,
  type SongCategory,
} from "../types";
import { cn } from "../utils/cn";
import { playClickSound } from "../utils/sounds";

interface SetupScreenProps {
  onStart: (names: string[], useTokens: boolean, category: SongCategory, ids?: string[], contentMode?: GameContentMode, historyCategory?: HistoryCategory) => void;
}

const MUSIC_CATEGORIES: SongCategory[] = ["mixed", "pop", "swedish", "rap", "rock"];
const HISTORY_CATEGORIES: HistoryCategory[] = ["all", "world", "sweden", "science", "culture", "sport", "society"];

export function SetupScreen({ onStart }: SetupScreenProps) {
  const [playerCount, setPlayerCount] = useState(2);
  const [names, setNames] = useState(["", ""]);
  const [useTokens, setUseTokens] = useState(true);
  const [contentMode, setContentMode] = useState<GameContentMode>("music");
  const [category, setCategory] = useState<SongCategory>("mixed");
  const [historyCategory, setHistoryCategory] = useState<HistoryCategory>("all");
  const musicCounts = useMemo(() => getCategoryCounts(), []);
  const historyCounts = useMemo(() => getHistoryCategoryCounts(), []);

  const updateCount = (count: number) => {
    playClickSound();
    setPlayerCount(count);
    setNames((previous) => {
      const next = [...previous];
      while (next.length < count) next.push("");
      return next.slice(0, count);
    });
  };

  const handleStart = () => {
    playClickSound();
    const finalNames = names.map((name, index) => name.trim() || `Spelare ${index + 1}`);
    onStart(finalNames, useTokens, category, undefined, contentMode, historyCategory);
  };

  const selectedMeta = contentMode === "music" ? CATEGORY_META[category] : HISTORY_CATEGORY_META[historyCategory];
  const totalCards = contentMode === "music" ? musicCounts[category] : historyCounts[historyCategory];

  return (
    <div className="relative mx-auto flex min-h-screen max-w-xl flex-col justify-center px-4 py-12">
      <div className="mb-8 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-violet-300">BeatLine</p>
        <h1 className="brand-text mt-2 text-5xl font-black sm:text-6xl">Bygg tidslinjen</h1>
        <p className="mx-auto mt-3 max-w-md text-white/55">Välj musik eller historia. Databaserna är helt separata.</p>
      </div>

      <div className="glass-panel space-y-6 rounded-[1.75rem] p-5 sm:p-7">
        <section>
          <label className="mb-3 block text-[11px] font-bold uppercase tracking-[0.2em] text-white/40">Innehåll</label>
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => setContentMode("music")} className={cn("rounded-2xl border p-4 text-left transition", contentMode === "music" ? "border-fuchsia-400/50 bg-fuchsia-500/15" : "border-white/10 bg-black/20")}>
              <div className="text-2xl">🎵</div><div className="mt-2 font-black">Musik</div><p className="mt-1 text-xs text-white/45">Den befintliga låtdatabasen.</p>
            </button>
            <button type="button" onClick={() => setContentMode("history")} className={cn("rounded-2xl border p-4 text-left transition", contentMode === "history" ? "border-amber-400/50 bg-amber-500/15" : "border-white/10 bg-black/20")}>
              <div className="text-2xl">📚</div><div className="mt-2 font-black">Historia</div><p className="mt-1 text-xs text-white/45">Separata händelser från 1900–2025.</p>
            </button>
          </div>
        </section>

        <section>
          <label className="mb-3 block text-[11px] font-bold uppercase tracking-[0.2em] text-white/40">{contentMode === "music" ? "Musikkategori" : "Historiekategori"}</label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {contentMode === "music" ? MUSIC_CATEGORIES.map((key) => {
              const meta = CATEGORY_META[key];
              const selected = category === key;
              return <button key={key} type="button" onClick={() => setCategory(key)} className={cn("rounded-2xl border p-3.5 text-left transition", selected ? "border-white/25 bg-white/10" : "border-white/10 bg-black/20 hover:bg-white/5")}>
                <div className="flex items-center justify-between gap-2"><span className="font-bold">{meta.emoji} {meta.label}</span><span className="text-xs text-white/45">{musicCounts[key]}</span></div><p className="mt-1 text-[11px] text-white/40">{meta.description}</p>
              </button>;
            }) : HISTORY_CATEGORIES.map((key) => {
              const meta = HISTORY_CATEGORY_META[key];
              const selected = historyCategory === key;
              return <button key={key} type="button" onClick={() => setHistoryCategory(key)} className={cn("rounded-2xl border p-3.5 text-left transition", selected ? "border-amber-400/40 bg-amber-500/10" : "border-white/10 bg-black/20 hover:bg-white/5")}>
                <div className="flex items-center justify-between gap-2"><span className="font-bold">{meta.emoji} {meta.label}</span><span className="text-xs text-white/45">{historyCounts[key]}</span></div><p className="mt-1 text-[11px] text-white/40">{meta.description}</p>
              </button>;
            })}
          </div>
        </section>

        <section>
          <label className="mb-3 block text-[11px] font-bold uppercase tracking-[0.2em] text-white/40">Antal spelare</label>
          <div className="grid grid-cols-6 gap-2">{[1, 2, 3, 4, 5, 6].map((number) => <button key={number} type="button" onClick={() => updateCount(number)} className={cn("flex h-12 items-center justify-center rounded-2xl text-sm font-bold transition", playerCount === number ? "bg-gradient-to-br from-violet-500 to-fuchsia-500" : "bg-white/5 text-white/45 ring-1 ring-white/10")}>{number}</button>)}</div>
        </section>

        <section className="space-y-3">
          <label className="block text-[11px] font-bold uppercase tracking-[0.2em] text-white/40">Spelarnamn</label>
          {names.map((name, index) => <div key={index} className="flex items-center gap-3"><div className="h-3.5 w-3.5 shrink-0 rounded-full" style={{ backgroundColor: PLAYER_COLORS[index] }} /><input type="text" value={name} onChange={(event) => { const next = [...names]; next[index] = event.target.value; setNames(next); }} placeholder={`Spelare ${index + 1}`} maxLength={16} className="w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-white placeholder:text-white/25 focus:outline-none" /></div>)}
        </section>

        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-black/25 p-4"><input type="checkbox" checked={useTokens} onChange={(event) => setUseTokens(event.target.checked)} className="mt-1 h-4 w-4 accent-violet-500" /><div><div className="font-semibold">Tokens</div><p className="mt-0.5 text-sm text-white/45">Hoppa över ett kort. Streak ×3 ger en bonustoken vid bankning.</p></div></label>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/60"><strong className="text-white">{selectedMeta.emoji} {selectedMeta.label}</strong><span className="ml-2">· {totalCards} separata kort</span><p className="mt-2 text-xs text-white/40">Historia läggs aldrig till i musikens Blandat-kategori.</p></div>

        <button type="button" onClick={handleStart} className="w-full rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-500 to-amber-400 py-4 text-lg font-black">Starta {contentMode === "history" ? "Historia" : "BeatLine"}</button>
      </div>
    </div>
  );
}