import { useMemo, useState, type ReactNode } from "react";
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
  onStart: (
    names: string[],
    useTokens: boolean,
    category: SongCategory,
    ids?: string[],
    contentMode?: GameContentMode,
    historyCategory?: HistoryCategory,
  ) => void;
}

type IconProps = { className?: string };
const MUSIC_CATEGORIES: SongCategory[] = ["mixed", "pop", "swedish", "rap", "rock"];
const HISTORY_CATEGORIES: HistoryCategory[] = ["all", "world", "sweden", "science", "culture", "sport", "society"];

const iconStroke = {
  stroke: "currentColor",
  strokeWidth: 3.2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function MusicIcon({ className = "h-12 w-12" }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
      <path d="M24 46V18l26-5v27" {...iconStroke} />
      <circle cx="17" cy="47" r="8" {...iconStroke} />
      <circle cx="43" cy="41" r="8" {...iconStroke} />
      <path d="M24 27l26-5" {...iconStroke} />
    </svg>
  );
}

function HistoryIcon({ className = "h-12 w-12" }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
      <path d="M10 20h44M15 20l17-10 17 10M16 24v22m11-22v22m10-22v22m11-22v22M10 50h44" {...iconStroke} />
    </svg>
  );
}

function CheckIcon({ className = "h-5 w-5" }: IconProps) {
  return <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true"><path d="m5 12 4 4L19 6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function PlayerIcon({ className = "h-8 w-8" }: IconProps) {
  return <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true"><circle cx="32" cy="21" r="10" {...iconStroke}/><path d="M13 54c2-15 9-22 19-22s17 7 19 22" {...iconStroke}/></svg>;
}

function TokenIcon({ className = "h-8 w-8" }: IconProps) {
  return <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true"><circle cx="32" cy="32" r="23" {...iconStroke}/><path d="m32 18 4 9 10 1-7 7 2 10-9-5-9 5 2-10-7-7 10-1 4-9Z" {...iconStroke}/></svg>;
}

function LocalHeroIcon() {
  return (
    <svg viewBox="0 0 210 125" className="h-24 w-44 sm:h-28 sm:w-48" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="localHeroGlow" x1="20" y1="15" x2="190" y2="115" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f472d0" />
          <stop offset="1" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <rect x="75" y="8" width="60" height="104" rx="12" stroke="url(#localHeroGlow)" strokeWidth="4" />
      <path d="M87 20h36" stroke="url(#localHeroGlow)" strokeWidth="4" strokeLinecap="round" />
      <circle cx="105" cy="99" r="4" fill="#d946ef" />
      <path d="M98 62V43l18-4v18" stroke="#f472d0" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="92" cy="65" r="6" stroke="#f472d0" strokeWidth="4" />
      <circle cx="110" cy="59" r="6" stroke="#f472d0" strokeWidth="4" />
      <circle cx="42" cy="52" r="14" stroke="#f472d0" strokeWidth="4" />
      <path d="M20 94c2-19 10-27 22-27s20 8 22 27" stroke="#f472d0" strokeWidth="4" strokeLinecap="round" />
      <circle cx="168" cy="52" r="14" stroke="#a855f7" strokeWidth="4" />
      <path d="M146 94c2-19 10-27 22-27s20 8 22 27" stroke="#a855f7" strokeWidth="4" strokeLinecap="round" />
      <path d="M54 24l-10-9M156 24l10-9M58 41H43M152 41h15" stroke="url(#localHeroGlow)" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

function CategoryIcon({ kind, className = "h-6 w-6" }: IconProps & { kind: SongCategory | HistoryCategory }) {
  const icons: Record<string, ReactNode> = {
    mixed: <><path d="M12 17h15l7 15h18M12 47h15l7-15h18" {...iconStroke}/><path d="m46 25 7 7-7 7M46 10l7 7-7 7M46 40l7 7-7 7" {...iconStroke}/></>,
    pop: <><rect x="23" y="8" width="18" height="34" rx="9" {...iconStroke}/><path d="M16 31v2a16 16 0 0 0 32 0v-2M32 49v8M23 57h18" {...iconStroke}/></>,
    swedish: <><path d="M18 13h28l-3 13 7 13-18 12-18-12 7-13-3-13Z" {...iconStroke}/><path d="M25 28h14M32 21v14" {...iconStroke}/></>,
    rap: <><path d="M12 34a20 20 0 0 1 40 0" {...iconStroke}/><rect x="8" y="32" width="11" height="19" rx="4" {...iconStroke}/><rect x="45" y="32" width="11" height="19" rx="4" {...iconStroke}/><path d="M50 51c0 5-4 8-10 8h-5" {...iconStroke}/></>,
    rock: <><path d="M20 52 37 11l6 17 10 3-13 8-3 17-8-13-9 9Z" {...iconStroke}/><path d="m36 29 7 10" {...iconStroke}/></>,
    all: <><circle cx="32" cy="32" r="23" {...iconStroke}/><path d="M9 32h46M32 9c8 7 12 15 12 23S40 48 32 55M32 9c-8 7-12 15-12 23s4 16 12 23" {...iconStroke}/></>,
    world: <><path d="M10 22h44M15 22 32 11l17 11M17 27v20m10-20v20m10-20v20m10-20v20M10 52h44" {...iconStroke}/></>,
    science: <><path d="M25 10h14M29 10v15L15 49a5 5 0 0 0 4 7h26a5 5 0 0 0 4-7L35 25V10" {...iconStroke}/><path d="M21 43h22M26 36h12" {...iconStroke}/></>,
    culture: <><rect x="9" y="15" width="46" height="34" rx="5" {...iconStroke}/><path d="m9 27 10-12 8 12 10-12 8 12 10-12M24 49v7M40 49v7M20 56h24" {...iconStroke}/></>,
    sport: <><circle cx="32" cy="31" r="17" {...iconStroke}/><path d="M25 48 20 58l12-5 12 5-5-10" {...iconStroke}/><path d="m32 21 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6Z" {...iconStroke}/></>,
    society: <><circle cx="22" cy="22" r="8" {...iconStroke}/><circle cx="43" cy="24" r="7" {...iconStroke}/><path d="M8 52c1-13 7-19 14-19s13 6 14 19M34 52c1-10 5-15 10-15s10 5 11 15" {...iconStroke}/></>,
  };
  return <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">{icons[kind]}</svg>;
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
    onStart(names.map((name, index) => name.trim() || `Spelare ${index + 1}`), useTokens, category, undefined, contentMode, historyCategory);
  };

  const selectedMeta = contentMode === "music" ? CATEGORY_META[category] : HISTORY_CATEGORY_META[historyCategory];
  const totalCards = contentMode === "music" ? musicCounts[category] : historyCounts[historyCategory];
  const activeCategory = contentMode === "music" ? category : historyCategory;

  return (
    <main className="relative mx-auto min-h-screen max-w-2xl overflow-hidden px-4 pb-20 pt-[calc(env(safe-area-inset-top)+8.5rem)] sm:px-6 sm:pt-28">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[38rem] bg-[radial-gradient(circle_at_50%_9%,_rgba(217,70,239,0.24),_transparent_52%)]" />
      <div className="pointer-events-none absolute left-[-12rem] top-[34rem] h-80 w-80 rounded-full bg-violet-600/10 blur-3xl" />

      <header className="relative flex flex-col items-center text-center">
        <div className="drop-shadow-[0_0_26px_rgba(217,70,239,0.5)]"><LocalHeroIcon /></div>
        <div className="mt-2 rounded-xl border border-fuchsia-400/60 bg-fuchsia-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-fuchsia-200 shadow-[0_0_20px_rgba(217,70,239,0.18)]">Lokalt spel</div>
        <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">På en enhet</h1>
        <p className="mt-3 text-sm text-white/55 sm:text-base">Alla spelar på samma telefon eller surfplatta.</p>
      </header>

      <div className="relative mt-10 space-y-9">
        <section>
          <h2 className="mb-4 text-sm font-black uppercase tracking-[0.18em]">Välj kategori</h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-5">
            <button type="button" onClick={() => { playClickSound(); setContentMode("music"); }} className={cn("relative min-h-56 rounded-[1.8rem] border p-5 text-center transition duration-200 active:scale-[0.985]", contentMode === "music" ? "border-fuchsia-400 bg-fuchsia-500/[0.09] shadow-[0_0_32px_rgba(217,70,239,0.22)]" : "border-violet-500/25 bg-black/30")}> 
              {contentMode === "music" && <span className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-fuchsia-500 shadow-[0_0_20px_rgba(217,70,239,0.55)]"><CheckIcon /></span>}
              <div className="mx-auto mt-5 flex h-20 w-20 items-center justify-center text-fuchsia-300 drop-shadow-[0_0_20px_rgba(244,114,208,0.65)]"><MusicIcon className="h-16 w-16" /></div>
              <h3 className="mt-4 text-2xl font-black">Musik</h3>
              <p className="mt-2 text-sm leading-6 text-white/55">Låtar, artister och musikfrågor</p>
            </button>
            <button type="button" onClick={() => { playClickSound(); setContentMode("history"); }} className={cn("relative min-h-56 rounded-[1.8rem] border p-5 text-center transition duration-200 active:scale-[0.985]", contentMode === "history" ? "border-violet-400 bg-violet-500/[0.1] shadow-[0_0_32px_rgba(139,92,246,0.24)]" : "border-violet-500/25 bg-black/30")}> 
              {contentMode === "history" && <span className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-violet-500 shadow-[0_0_20px_rgba(139,92,246,0.55)]"><CheckIcon /></span>}
              <div className="mx-auto mt-5 flex h-20 w-20 items-center justify-center text-violet-400 drop-shadow-[0_0_20px_rgba(139,92,246,0.7)]"><HistoryIcon className="h-16 w-16" /></div>
              <h3 className="mt-4 text-2xl font-black">Historia</h3>
              <p className="mt-2 text-sm leading-6 text-white/55">Händelser, personer och årtal</p>
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {(contentMode === "music" ? MUSIC_CATEGORIES : HISTORY_CATEGORIES).map((key) => {
              const meta = contentMode === "music" ? CATEGORY_META[key as SongCategory] : HISTORY_CATEGORY_META[key as HistoryCategory];
              const count = contentMode === "music" ? musicCounts[key as SongCategory] : historyCounts[key as HistoryCategory];
              const selected = activeCategory === key;
              return (
                <button key={key} type="button" onClick={() => { playClickSound(); contentMode === "music" ? setCategory(key as SongCategory) : setHistoryCategory(key as HistoryCategory); }} className={cn("flex min-h-14 items-center gap-3 rounded-xl border px-3 py-3 text-left text-sm font-bold transition active:scale-[0.98]", selected ? contentMode === "music" ? "border-fuchsia-400/65 bg-fuchsia-500/15 text-white shadow-[0_0_18px_rgba(217,70,239,0.12)]" : "border-violet-400/65 bg-violet-500/15 text-white shadow-[0_0_18px_rgba(139,92,246,0.12)]" : "border-white/10 bg-black/30 text-white/55")}> 
                  <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", selected ? "bg-white/10 text-current" : "bg-white/[0.035] text-white/40")}><CategoryIcon kind={key} className="h-6 w-6" /></span>
                  <span className="min-w-0 flex-1 truncate">{meta.label}</span>
                  <span className="text-[10px] font-bold text-white/35">{count}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-sm font-black uppercase tracking-[0.18em]">Välj antal spelare</h2>
          <div className="grid grid-cols-6 gap-2 sm:gap-3">
            {[1, 2, 3, 4, 5, 6].map((number) => <button key={number} type="button" onClick={() => updateCount(number)} className={cn("flex h-14 items-center justify-center rounded-xl border text-lg font-black transition active:scale-95", playerCount === number ? "border-fuchsia-300 bg-gradient-to-br from-fuchsia-500 to-pink-600 shadow-[0_0_24px_rgba(217,70,239,0.36)]" : "border-violet-500/25 bg-black/30 text-white/70")}>{number}</button>)}
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-sm font-black uppercase tracking-[0.18em]">Spelare</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {names.map((name, index) => <div key={index} className="flex items-center gap-3"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-black text-white shadow-[0_0_18px_rgba(255,255,255,0.1)]" style={{ backgroundColor: PLAYER_COLORS[index] }}>{index + 1}</div><div className="flex min-w-0 flex-1 items-center rounded-xl border border-white/15 bg-black/30 px-3 focus-within:border-fuchsia-400/50"><input value={name} onChange={(event) => { const next = [...names]; next[index] = event.target.value; setNames(next); }} placeholder={`Spelare ${index + 1}`} maxLength={16} className="min-w-0 flex-1 bg-transparent py-3 font-semibold outline-none placeholder:text-white/40" /><span className="h-5 w-5 rounded-full border-2 border-white/70" style={{ backgroundColor: PLAYER_COLORS[index] }} /></div></div>)}
          </div>
        </section>

        <section className="border-t border-white/10 pt-7">
          <div className="flex items-center justify-between gap-4">
            <div><h2 className="text-sm font-black uppercase tracking-[0.18em]">Tokens</h2><p className="mt-2 text-sm text-white/50">Låt spelarna hoppa över ett svårt kort.</p></div>
            <button type="button" aria-pressed={useTokens} onClick={() => { playClickSound(); setUseTokens((value) => !value); }} className={cn("relative h-12 w-24 rounded-full border p-1 transition", useTokens ? "border-fuchsia-300/70 bg-fuchsia-500/30 shadow-[0_0_20px_rgba(217,70,239,0.2)]" : "border-white/15 bg-black/30")}><span className={cn("flex h-9 w-9 items-center justify-center rounded-full transition-transform", useTokens ? "translate-x-12 bg-fuchsia-500 text-white" : "translate-x-0 bg-white/10 text-white/45")}><TokenIcon className="h-5 w-5" /></span></button>
          </div>
        </section>

        <section className="rounded-[1.8rem] border border-violet-500/25 bg-black/30 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
          <h2 className="text-sm font-black uppercase tracking-[0.18em]">Sammanfattning</h2>
          <div className="mt-5 grid grid-cols-3 divide-x divide-white/10 text-center">
            <div className="px-2"><div className="mx-auto flex h-9 w-9 items-center justify-center text-fuchsia-400">{contentMode === "music" ? <MusicIcon className="h-8 w-8" /> : <HistoryIcon className="h-8 w-8" />}</div><p className="mt-2 text-sm font-black">{selectedMeta.label}</p></div>
            <div className="px-2"><div className="mx-auto flex h-9 w-9 items-center justify-center text-fuchsia-400"><PlayerIcon /></div><p className="mt-2 text-sm font-black">{playerCount} {playerCount === 1 ? "spelare" : "spelare"}</p></div>
            <div className="px-2"><div className="mx-auto flex h-9 w-9 items-center justify-center text-fuchsia-400"><TokenIcon /></div><p className="mt-2 text-sm font-black">Tokens {useTokens ? "på" : "av"}</p></div>
          </div>
          <p className="mt-4 text-center text-xs text-white/35">{totalCards} kort i vald kategori</p>
        </section>

        <button type="button" onClick={handleStart} className="w-full rounded-[1.5rem] border border-fuchsia-300/60 bg-gradient-to-r from-fuchsia-600 via-pink-500 to-fuchsia-600 py-5 text-xl font-black uppercase tracking-[0.08em] shadow-[0_0_34px_rgba(217,70,239,0.38)] transition active:scale-[0.985]">Starta spel</button>
      </div>
    </main>
  );
}
