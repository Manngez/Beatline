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

function MusicIcon() {
  return <svg viewBox="0 0 64 64" className="h-9 w-9" fill="none"><path d="M24 46V18l26-5v27" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/><circle cx="17" cy="47" r="8" stroke="currentColor" strokeWidth="4"/><circle cx="43" cy="41" r="8" stroke="currentColor" strokeWidth="4"/><path d="M24 27l26-5" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/></svg>;
}

function HistoryIcon() {
  return <svg viewBox="0 0 64 64" className="h-9 w-9" fill="none"><path d="M10 20h44M15 20l17-10 17 10M16 24v22m11-22v22m10-22v22m11-22v22M10 50h44" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

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
    <main className="relative mx-auto min-h-screen max-w-2xl overflow-hidden px-4 pb-14 pt-20 sm:px-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_top,_rgba(168,85,247,0.30),_transparent_68%)]" />

      <header className="relative text-center">
        <p className="text-[11px] font-black uppercase tracking-[0.34em] text-fuchsia-300">Lokalt spel</p>
        <h1 className="brand-text brand-glow mt-3 text-4xl font-black sm:text-5xl">Gör spelet redo</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-white/50">Välj innehåll, antal spelare och namn innan ni börjar bygga tidslinjen.</p>
      </header>

      <div className="relative mt-8 space-y-5">
        <section className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-4 shadow-2xl backdrop-blur-xl sm:p-5">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div><p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/35">Steg 1</p><h2 className="mt-1 text-xl font-black">Vad vill ni spela?</h2></div>
            <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-white/45">{totalCards} kort</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => { playClickSound(); setContentMode("music"); }} className={cn("group rounded-[1.5rem] border p-4 text-left transition active:scale-[0.98]", contentMode === "music" ? "border-fuchsia-400/60 bg-fuchsia-500/15 shadow-[0_0_28px_rgba(217,70,239,0.16)]" : "border-white/10 bg-black/20")}>
              <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl", contentMode === "music" ? "bg-fuchsia-500/20 text-fuchsia-300" : "bg-white/5 text-white/45")}><MusicIcon /></div>
              <div className="mt-4 text-lg font-black">Musik</div><p className="mt-1 text-xs leading-5 text-white/45">Placera låtar i rätt årtionde.</p>
            </button>
            <button type="button" onClick={() => { playClickSound(); setContentMode("history"); }} className={cn("group rounded-[1.5rem] border p-4 text-left transition active:scale-[0.98]", contentMode === "history" ? "border-amber-300/60 bg-amber-400/10 shadow-[0_0_28px_rgba(251,191,36,0.13)]" : "border-white/10 bg-black/20")}>
              <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl", contentMode === "history" ? "bg-amber-400/15 text-amber-300" : "bg-white/5 text-white/45")}><HistoryIcon /></div>
              <div className="mt-4 text-lg font-black">Historia</div><p className="mt-1 text-xs leading-5 text-white/45">Placera händelser på tidslinjen.</p>
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {contentMode === "music" ? MUSIC_CATEGORIES.map((key) => {
              const meta = CATEGORY_META[key];
              const selected = category === key;
              return <button key={key} type="button" onClick={() => { playClickSound(); setCategory(key); }} className={cn("rounded-2xl border px-3 py-3 text-left transition active:scale-[0.98]", selected ? "border-fuchsia-400/45 bg-fuchsia-500/12" : "border-white/8 bg-black/20 text-white/55")}><div className="flex items-center justify-between gap-2"><span className="truncate text-sm font-bold">{meta.emoji} {meta.label}</span><span className="text-[10px] text-white/35">{musicCounts[key]}</span></div></button>;
            }) : HISTORY_CATEGORIES.map((key) => {
              const meta = HISTORY_CATEGORY_META[key];
              const selected = historyCategory === key;
              return <button key={key} type="button" onClick={() => { playClickSound(); setHistoryCategory(key); }} className={cn("rounded-2xl border px-3 py-3 text-left transition active:scale-[0.98]", selected ? "border-amber-300/45 bg-amber-400/10" : "border-white/8 bg-black/20 text-white/55")}><div className="flex items-center justify-between gap-2"><span className="truncate text-sm font-bold">{meta.emoji} {meta.label}</span><span className="text-[10px] text-white/35">{historyCounts[key]}</span></div></button>;
            })}
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-4 backdrop-blur-xl sm:p-5">
          <div className="mb-4"><p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/35">Steg 2</p><h2 className="mt-1 text-xl font-black">Hur många spelar?</h2></div>
          <div className="grid grid-cols-6 gap-2">{[1, 2, 3, 4, 5, 6].map((number) => <button key={number} type="button" onClick={() => updateCount(number)} className={cn("flex h-12 items-center justify-center rounded-2xl text-sm font-black transition active:scale-95", playerCount === number ? "bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 shadow-[0_0_22px_rgba(217,70,239,0.28)]" : "border border-white/10 bg-black/25 text-white/45")}>{number}</button>)}</div>

          <div className="mt-5 space-y-3">
            {names.map((name, index) => <div key={index} className="flex items-center gap-3 rounded-2xl border border-white/8 bg-black/20 p-2"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-black text-black" style={{ backgroundColor: PLAYER_COLORS[index] }}>{index + 1}</div><input type="text" value={name} onChange={(event) => { const next = [...names]; next[index] = event.target.value; setNames(next); }} placeholder={`Spelare ${index + 1}`} maxLength={16} className="min-w-0 flex-1 bg-transparent px-2 py-2 font-semibold text-white outline-none placeholder:text-white/25" /></div>)}
          </div>
        </section>

        <label className="flex cursor-pointer items-center justify-between gap-4 rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-4 backdrop-blur-xl">
          <div><div className="font-black">Använd tokens</div><p className="mt-1 text-xs leading-5 text-white/45">Ger spelarna möjlighet att hoppa över ett svårt kort.</p></div>
          <input type="checkbox" checked={useTokens} onChange={(event) => setUseTokens(event.target.checked)} className="h-5 w-5 shrink-0 accent-fuchsia-500" />
        </label>

        <div className="rounded-[1.5rem] border border-white/10 bg-black/25 px-4 py-3 text-sm text-white/55"><strong className="text-white">{selectedMeta.emoji} {selectedMeta.label}</strong><span className="ml-2">· {playerCount} {playerCount === 1 ? "spelare" : "spelare"} · {totalCards} kort</span></div>

        <button type="button" onClick={handleStart} className="w-full rounded-[1.5rem] bg-gradient-to-r from-violet-600 via-fuchsia-500 to-pink-500 py-4 text-lg font-black shadow-[0_14px_45px_rgba(217,70,239,0.28)] transition active:scale-[0.985]">Starta spelet</button>
      </div>
    </main>
  );
}
