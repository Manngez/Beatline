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

function MusicIcon({ className = "h-12 w-12" }: { className?: string }) {
  return <svg viewBox="0 0 64 64" className={className} fill="none"><path d="M24 46V18l26-5v27" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/><circle cx="17" cy="47" r="8" stroke="currentColor" strokeWidth="4"/><circle cx="43" cy="41" r="8" stroke="currentColor" strokeWidth="4"/><path d="M24 27l26-5" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/></svg>;
}

function HistoryIcon({ className = "h-12 w-12" }: { className?: string }) {
  return <svg viewBox="0 0 64 64" className={className} fill="none"><path d="M10 20h44M15 20l17-10 17 10M16 24v22m11-22v22m10-22v22m11-22v22M10 50h44" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

function LocalHeroIcon() {
  return <svg viewBox="0 0 210 125" className="h-28 w-48" fill="none">
    <defs><linearGradient id="heroGlow" x1="20" y1="15" x2="190" y2="115" gradientUnits="userSpaceOnUse"><stop stopColor="#f472d0"/><stop offset="1" stopColor="#8b5cf6"/></linearGradient></defs>
    <rect x="75" y="8" width="60" height="104" rx="12" stroke="url(#heroGlow)" strokeWidth="4"/>
    <path d="M87 20h36" stroke="url(#heroGlow)" strokeWidth="4" strokeLinecap="round"/>
    <circle cx="105" cy="99" r="4" fill="#d946ef"/>
    <path d="M98 62V43l18-4v18" stroke="#f472d0" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="92" cy="65" r="6" stroke="#f472d0" strokeWidth="4"/>
    <circle cx="110" cy="59" r="6" stroke="#f472d0" strokeWidth="4"/>
    <circle cx="42" cy="52" r="14" stroke="#f472d0" strokeWidth="4"/><path d="M20 94c2-19 10-27 22-27s20 8 22 27" stroke="#f472d0" strokeWidth="4" strokeLinecap="round"/>
    <circle cx="168" cy="52" r="14" stroke="#a855f7" strokeWidth="4"/><path d="M146 94c2-19 10-27 22-27s20 8 22 27" stroke="#a855f7" strokeWidth="4" strokeLinecap="round"/>
    <path d="M54 24l-10-9M156 24l10-9M58 41H43M152 41h15" stroke="url(#heroGlow)" strokeWidth="4" strokeLinecap="round"/>
  </svg>;
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
    <main className="relative mx-auto min-h-screen max-w-2xl overflow-hidden px-4 pb-14 pt-16 sm:px-6 sm:pt-20">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(circle_at_50%_10%,_rgba(217,70,239,0.22),_transparent_52%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-72 h-72 bg-[radial-gradient(circle_at_25%_50%,_rgba(139,92,246,0.12),_transparent_58%)]" />

      <header className="relative flex flex-col items-center text-center">
        <div className="drop-shadow-[0_0_24px_rgba(217,70,239,0.45)]"><LocalHeroIcon /></div>
        <div className="mt-1 rounded-xl border border-fuchsia-400/60 bg-fuchsia-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-fuchsia-200 shadow-[0_0_20px_rgba(217,70,239,0.18)]">Lokalt spel</div>
        <h1 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">På en enhet</h1>
        <p className="mt-3 text-sm text-white/55 sm:text-base">Alla spelar på samma telefon eller surfplatta.</p>
      </header>

      <div className="relative mt-10 space-y-8">
        <section>
          <h2 className="mb-4 text-sm font-black uppercase tracking-[0.16em] text-white">Välj kategori</h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-5">
            <button type="button" onClick={() => { playClickSound(); setContentMode("music"); }} className={cn("relative min-h-56 rounded-[1.7rem] border p-5 text-center transition active:scale-[0.985]", contentMode === "music" ? "border-fuchsia-400 bg-fuchsia-500/[0.08] shadow-[0_0_30px_rgba(217,70,239,0.20)]" : "border-violet-500/30 bg-black/25")}>
              {contentMode === "music" && <span className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-fuchsia-500 text-lg font-black shadow-[0_0_20px_rgba(217,70,239,0.55)]">✓</span>}
              <div className="mx-auto mt-5 flex h-20 w-20 items-center justify-center text-fuchsia-300 drop-shadow-[0_0_18px_rgba(244,114,208,0.65)]"><MusicIcon className="h-16 w-16" /></div>
              <h3 className="mt-4 text-2xl font-black">Musik</h3>
              <p className="mt-2 text-sm leading-6 text-white/60">Låtar, artister och musikfrågor</p>
            </button>
            <button type="button" onClick={() => { playClickSound(); setContentMode("history"); }} className={cn("relative min-h-56 rounded-[1.7rem] border p-5 text-center transition active:scale-[0.985]", contentMode === "history" ? "border-violet-400 bg-violet-500/[0.09] shadow-[0_0_30px_rgba(139,92,246,0.22)]" : "border-violet-500/30 bg-black/25")}>
              {contentMode === "history" && <span className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-violet-500 text-lg font-black shadow-[0_0_20px_rgba(139,92,246,0.55)]">✓</span>}
              <div className="mx-auto mt-5 flex h-20 w-20 items-center justify-center text-violet-400 drop-shadow-[0_0_18px_rgba(139,92,246,0.7)]"><HistoryIcon className="h-16 w-16" /></div>
              <h3 className="mt-4 text-2xl font-black">Historia</h3>
              <p className="mt-2 text-sm leading-6 text-white/60">Händelser, personer och årtal</p>
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {contentMode === "music" ? MUSIC_CATEGORIES.map((key) => {
              const meta = CATEGORY_META[key];
              const selected = category === key;
              return <button key={key} type="button" onClick={() => { playClickSound(); setCategory(key); }} className={cn("rounded-xl border px-3 py-3 text-left text-sm font-bold transition", selected ? "border-fuchsia-400/60 bg-fuchsia-500/15 text-white" : "border-white/10 bg-black/25 text-white/50")}>{meta.emoji} {meta.label}<span className="float-right text-[10px] text-white/35">{musicCounts[key]}</span></button>;
            }) : HISTORY_CATEGORIES.map((key) => {
              const meta = HISTORY_CATEGORY_META[key];
              const selected = historyCategory === key;
              return <button key={key} type="button" onClick={() => { playClickSound(); setHistoryCategory(key); }} className={cn("rounded-xl border px-3 py-3 text-left text-sm font-bold transition", selected ? "border-violet-400/60 bg-violet-500/15 text-white" : "border-white/10 bg-black/25 text-white/50")}>{meta.emoji} {meta.label}<span className="float-right text-[10px] text-white/35">{historyCounts[key]}</span></button>;
            })}
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-sm font-black uppercase tracking-[0.16em] text-white">Välj antal spelare</h2>
          <div className="grid grid-cols-6 gap-2 sm:gap-3">{[1, 2, 3, 4, 5, 6].map((number) => <button key={number} type="button" onClick={() => updateCount(number)} className={cn("flex h-14 items-center justify-center rounded-xl border text-lg font-black transition active:scale-95", playerCount === number ? "border-fuchsia-400 bg-gradient-to-br from-fuchsia-500 to-pink-600 shadow-[0_0_24px_rgba(217,70,239,0.38)]" : "border-violet-500/25 bg-black/25 text-white/70")}>{number}</button>)}</div>
        </section>

        <section>
          <h2 className="mb-4 text-sm font-black uppercase tracking-[0.16em] text-white">Spelare</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {names.map((name, index) => <div key={index} className="flex items-center gap-3"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-black text-white shadow-[0_0_18px_rgba(255,255,255,0.10)]" style={{ backgroundColor: PLAYER_COLORS[index] }}>{index + 1}</div><div className="flex min-w-0 flex-1 items-center rounded-xl border border-white/15 bg-black/25 px-3"><input type="text" value={name} onChange={(event) => { const next = [...names]; next[index] = event.target.value; setNames(next); }} placeholder={`Spelare ${index + 1}`} maxLength={16} className="min-w-0 flex-1 bg-transparent py-3 font-semibold text-white outline-none placeholder:text-white/45" /><span className="h-5 w-5 rounded-full border-2 border-white/70" style={{ backgroundColor: PLAYER_COLORS[index] }} /></div></div>)}
          </div>
        </section>

        <section className="border-t border-white/10 pt-7">
          <div className="flex items-center justify-between gap-4">
            <div><h2 className="text-sm font-black uppercase tracking-[0.16em] text-white">Tokens</h2><p className="mt-2 text-sm text-white/50">Låt spelarna hoppa över ett svårt kort.</p></div>
            <button type="button" onClick={() => { playClickSound(); setUseTokens((value) => !value); }} className={cn("rounded-xl border px-5 py-3 text-sm font-black transition", useTokens ? "border-fuchsia-400 bg-fuchsia-500 text-white shadow-[0_0_22px_rgba(217,70,239,0.30)]" : "border-white/15 bg-black/25 text-white/50")}>{useTokens ? "På" : "Av"}</button>
          </div>
        </section>

        <section className="rounded-[1.7rem] border border-violet-500/25 bg-black/25 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <h2 className="text-sm font-black uppercase tracking-[0.16em] text-white">Sammanfattning</h2>
          <div className="mt-5 grid grid-cols-3 divide-x divide-white/10 text-center">
            <div className="px-2"><div className="mx-auto flex h-9 w-9 items-center justify-center text-fuchsia-400">{contentMode === "music" ? <MusicIcon className="h-8 w-8" /> : <HistoryIcon className="h-8 w-8" />}</div><p className="mt-2 text-sm font-black">{selectedMeta.label}</p></div>
            <div className="px-2"><div className="text-3xl text-fuchsia-400">♙</div><p className="mt-2 text-sm font-black">{playerCount} {playerCount === 1 ? "spelare" : "spelare"}</p></div>
            <div className="px-2"><div className="text-3xl text-fuchsia-400">☆</div><p className="mt-2 text-sm font-black">Tokens {useTokens ? "på" : "av"}</p></div>
          </div>
          <p className="mt-4 text-center text-xs text-white/35">{totalCards} kort i vald kategori</p>
        </section>

        <button type="button" onClick={handleStart} className="w-full rounded-[1.5rem] border border-fuchsia-300/60 bg-gradient-to-r from-fuchsia-600 via-pink-500 to-fuchsia-600 py-5 text-xl font-black uppercase tracking-[0.08em] shadow-[0_0_32px_rgba(217,70,239,0.36)] transition active:scale-[0.985]">Starta spel</button>
      </div>
    </main>
  );
}
