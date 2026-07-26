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

type IconProps = { className?: string };

function MusicIcon({ className = "h-12 w-12" }: IconProps) {
  return <svg viewBox="0 0 64 64" className={className} fill="none"><path d="M24 46V18l26-5v27" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/><circle cx="17" cy="47" r="8" stroke="currentColor" strokeWidth="4"/><circle cx="43" cy="41" r="8" stroke="currentColor" strokeWidth="4"/><path d="M24 27l26-5" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/></svg>;
}
function HistoryIcon({ className = "h-12 w-12" }: IconProps) {
  return <svg viewBox="0 0 64 64" className={className} fill="none"><path d="M10 20h44M15 20l17-10 17 10M16 24v22m11-22v22m10-22v22m11-22v22M10 50h44" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
function CategoryIcon({ kind, className = "h-5 w-5" }: IconProps & { kind: SongCategory | HistoryCategory }) {
  const common = { stroke: "currentColor", strokeWidth: 3.2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const paths: Record<string, React.ReactNode> = {
    mixed: <><path d="M13 13h10v10H13zM41 13h10v10H41zM13 41h10v10H13zM41 41h10v10H41z" {...common}/><path d="M25 18h14M18 25v14M46 25v14M25 46h14" {...common}/></>,
    pop: <><path d="M32 9a11 11 0 0 0-11 11v14a11 11 0 0 0 22 0V20A11 11 0 0 0 32 9Z" {...common}/><path d="M15 30v4a17 17 0 0 0 34 0v-4M32 51v7M24 58h16" {...common}/></>,
    swedish: <><rect x="9" y="13" width="46" height="38" rx="5" {...common}/><path d="M23 13v38M9 31h46" {...common}/></>,
    rap: <><path d="M13 32a19 19 0 0 1 38 0" {...common}/><rect x="9" y="31" width="10" height="18" rx="4" {...common}/><rect x="45" y="31" width="10" height="18" rx="4" {...common}/><path d="M50 49c0 5-4 8-9 8h-6" {...common}/></>,
    rock: <><path d="M37 8 24 34l8 4-7 18 20-28-9-4 8-16Z" {...common}/></>,
    all: <><circle cx="32" cy="32" r="23" {...common}/><path d="M9 32h46M32 9c8 7 12 15 12 23S40 48 32 55M32 9c-8 7-12 15-12 23s4 16 12 23" {...common}/></>,
    world: <><path d="M10 22h44M15 22 32 11l17 11M17 27v20m10-20v20m10-20v20m10-20v20M10 52h44" {...common}/></>,
    science: <><path d="M19 47 44 22M38 16l10 10M14 52l7-2-5-5-2 7Z" {...common}/><circle cx="45" cy="18" r="8" {...common}/></>,
    culture: <><rect x="9" y="15" width="46" height="34" rx="5" {...common}/><path d="m9 27 10-12 8 12 10-12 8 12 10-12M24 49v7M40 49v7M20 56h24" {...common}/></>,
    sport: <><circle cx="32" cy="32" r="21" {...common}/><path d="m32 11 7 13 14 3-10 10 2 15-13-7-13 7 2-15-10-10 14-3 7-13Z" {...common}/></>,
    society: <><circle cx="22" cy="22" r="8" {...common}/><circle cx="43" cy="24" r="7" {...common}/><path d="M8 52c1-13 7-19 14-19s13 6 14 19M34 52c1-10 5-15 10-15s10 5 11 15" {...common}/></>,
  };
  return <svg viewBox="0 0 64 64" className={className} fill="none">{paths[kind]}</svg>;
}
function PlayerIcon({ className = "h-8 w-8" }: IconProps) {
  return <svg viewBox="0 0 64 64" className={className} fill="none"><circle cx="32" cy="21" r="10" stroke="currentColor" strokeWidth="4"/><path d="M13 54c2-15 9-22 19-22s17 7 19 22" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/></svg>;
}
function TokenIcon({ className = "h-8 w-8" }: IconProps) {
  return <svg viewBox="0 0 64 64" className={className} fill="none"><circle cx="32" cy="32" r="23" stroke="currentColor" strokeWidth="4"/><path d="m32 18 4 9 10 1-7 7 2 10-9-5-9 5 2-10-7-7 10-1 4-9Z" stroke="currentColor" strokeWidth="3.5" strokeLinejoin="round"/></svg>;
}
function LocalHeroIcon() {
  return <svg viewBox="0 0 210 125" className="h-28 w-48" fill="none"><defs><linearGradient id="heroGlow" x1="20" y1="15" x2="190" y2="115" gradientUnits="userSpaceOnUse"><stop stopColor="#f472d0"/><stop offset="1" stopColor="#8b5cf6"/></linearGradient></defs><rect x="75" y="8" width="60" height="104" rx="12" stroke="url(#heroGlow)" strokeWidth="4"/><path d="M87 20h36" stroke="url(#heroGlow)" strokeWidth="4" strokeLinecap="round"/><circle cx="105" cy="99" r="4" fill="#d946ef"/><path d="M98 62V43l18-4v18" stroke="#f472d0" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/><circle cx="92" cy="65" r="6" stroke="#f472d0" strokeWidth="4"/><circle cx="110" cy="59" r="6" stroke="#f472d0" strokeWidth="4"/><circle cx="42" cy="52" r="14" stroke="#f472d0" strokeWidth="4"/><path d="M20 94c2-19 10-27 22-27s20 8 22 27" stroke="#f472d0" strokeWidth="4" strokeLinecap="round"/><circle cx="168" cy="52" r="14" stroke="#a855f7" strokeWidth="4"/><path d="M146 94c2-19 10-27 22-27s20 8 22 27" stroke="#a855f7" strokeWidth="4" strokeLinecap="round"/><path d="M54 24l-10-9M156 24l10-9M58 41H43M152 41h15" stroke="url(#heroGlow)" strokeWidth="4" strokeLinecap="round"/></svg>;
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
  const updateCount = (count: number) => { playClickSound(); setPlayerCount(count); setNames((previous) => { const next = [...previous]; while (next.length < count) next.push(""); return next.slice(0, count); }); };
  const handleStart = () => { playClickSound(); onStart(names.map((name, index) => name.trim() || `Spelare ${index + 1}`), useTokens, category, undefined, contentMode, historyCategory); };
  const selectedMeta = contentMode === "music" ? CATEGORY_META[category] : HISTORY_CATEGORY_META[historyCategory];
  const totalCards = contentMode === "music" ? musicCounts[category] : historyCounts[historyCategory];

  return <main className="relative mx-auto min-h-screen max-w-2xl overflow-hidden px-4 pb-14 pt-16 sm:px-6 sm:pt-20">
    <div className="pointer-events-none absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(circle_at_50%_10%,_rgba(217,70,239,0.22),_transparent_52%)]" />
    <header className="relative flex flex-col items-center text-center"><div className="drop-shadow-[0_0_24px_rgba(217,70,239,0.45)]"><LocalHeroIcon /></div><div className="mt-1 rounded-xl border border-fuchsia-400/60 bg-fuchsia-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-fuchsia-200">Lokalt spel</div><h1 className="mt-4 text-4xl font-black sm:text-5xl">På en enhet</h1><p className="mt-3 text-sm text-white/55 sm:text-base">Alla spelar på samma telefon eller surfplatta.</p></header>
    <div className="relative mt-10 space-y-8">
      <section><h2 className="mb-4 text-sm font-black uppercase tracking-[0.16em]">Välj kategori</h2><div className="grid grid-cols-2 gap-3 sm:gap-5">
        <button type="button" onClick={() => { playClickSound(); setContentMode("music"); }} className={cn("relative min-h-56 rounded-[1.7rem] border p-5 text-center transition active:scale-[0.985]", contentMode === "music" ? "border-fuchsia-400 bg-fuchsia-500/[0.08] shadow-[0_0_30px_rgba(217,70,239,0.20)]" : "border-violet-500/30 bg-black/25")}>{contentMode === "music" && <span className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-fuchsia-500 font-black">✓</span>}<div className="mx-auto mt-5 flex h-20 w-20 items-center justify-center text-fuchsia-300"><MusicIcon className="h-16 w-16" /></div><h3 className="mt-4 text-2xl font-black">Musik</h3><p className="mt-2 text-sm text-white/60">Låtar, artister och musikfrågor</p></button>
        <button type="button" onClick={() => { playClickSound(); setContentMode("history"); }} className={cn("relative min-h-56 rounded-[1.7rem] border p-5 text-center transition active:scale-[0.985]", contentMode === "history" ? "border-violet-400 bg-violet-500/[0.09] shadow-[0_0_30px_rgba(139,92,246,0.22)]" : "border-violet-500/30 bg-black/25")}>{contentMode === "history" && <span className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-violet-500 font-black">✓</span>}<div className="mx-auto mt-5 flex h-20 w-20 items-center justify-center text-violet-400"><HistoryIcon className="h-16 w-16" /></div><h3 className="mt-4 text-2xl font-black">Historia</h3><p className="mt-2 text-sm text-white/60">Händelser, personer och årtal</p></button>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">{contentMode === "music" ? MUSIC_CATEGORIES.map((key) => { const meta = CATEGORY_META[key]; const selected = category === key; return <button key={key} type="button" onClick={() => { playClickSound(); setCategory(key); }} className={cn("flex items-center gap-2 rounded-xl border px-3 py-3 text-left text-sm font-bold transition", selected ? "border-fuchsia-400/60 bg-fuchsia-500/15" : "border-white/10 bg-black/25 text-white/50")}><CategoryIcon kind={key} className="h-5 w-5 shrink-0"/><span className="truncate">{meta.label}</span><span className="ml-auto text-[10px] text-white/35">{musicCounts[key]}</span></button>; }) : HISTORY_CATEGORIES.map((key) => { const meta = HISTORY_CATEGORY_META[key]; const selected = historyCategory === key; return <button key={key} type="button" onClick={() => { playClickSound(); setHistoryCategory(key); }} className={cn("flex items-center gap-2 rounded-xl border px-3 py-3 text-left text-sm font-bold transition", selected ? "border-violet-400/60 bg-violet-500/15" : "border-white/10 bg-black/25 text-white/50")}><CategoryIcon kind={key} className="h-5 w-5 shrink-0"/><span className="truncate">{meta.label}</span><span className="ml-auto text-[10px] text-white/35">{historyCounts[key]}</span></button>; })}</div></section>
      <section><h2 className="mb-4 text-sm font-black uppercase tracking-[0.16em]">Välj antal spelare</h2><div className="grid grid-cols-6 gap-2">{[1,2,3,4,5,6].map((number) => <button key={number} type="button" onClick={() => updateCount(number)} className={cn("flex h-14 items-center justify-center rounded-xl border text-lg font-black", playerCount === number ? "border-fuchsia-400 bg-gradient-to-br from-fuchsia-500 to-pink-600" : "border-violet-500/25 bg-black/25 text-white/70")}>{number}</button>)}</div></section>
      <section><h2 className="mb-4 text-sm font-black uppercase tracking-[0.16em]">Spelare</h2><div className="grid gap-3 sm:grid-cols-2">{names.map((name,index) => <div key={index} className="flex items-center gap-3"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-black" style={{backgroundColor:PLAYER_COLORS[index]}}>{index+1}</div><div className="flex min-w-0 flex-1 items-center rounded-xl border border-white/15 bg-black/25 px-3"><input value={name} onChange={(event)=>{const next=[...names];next[index]=event.target.value;setNames(next);}} placeholder={`Spelare ${index+1}`} maxLength={16} className="min-w-0 flex-1 bg-transparent py-3 font-semibold outline-none placeholder:text-white/45"/><span className="h-5 w-5 rounded-full border-2 border-white/70" style={{backgroundColor:PLAYER_COLORS[index]}}/></div></div>)}</div></section>
      <section className="border-t border-white/10 pt-7"><div className="flex items-center justify-between gap-4"><div><h2 className="text-sm font-black uppercase tracking-[0.16em]">Tokens</h2><p className="mt-2 text-sm text-white/50">Låt spelarna hoppa över ett svårt kort.</p></div><button type="button" onClick={()=>{playClickSound();setUseTokens(v=>!v);}} className={cn("rounded-xl border px-5 py-3 text-sm font-black",useTokens?"border-fuchsia-400 bg-fuchsia-500":"border-white/15 bg-black/25 text-white/50")}>{useTokens?"På":"Av"}</button></div></section>
      <section className="rounded-[1.7rem] border border-violet-500/25 bg-black/25 p-5"><h2 className="text-sm font-black uppercase tracking-[0.16em]">Sammanfattning</h2><div className="mt-5 grid grid-cols-3 divide-x divide-white/10 text-center"><div className="px-2"><div className="mx-auto flex h-9 w-9 items-center justify-center text-fuchsia-400">{contentMode==="music"?<MusicIcon className="h-8 w-8"/>:<HistoryIcon className="h-8 w-8"/>}</div><p className="mt-2 text-sm font-black">{selectedMeta.label}</p></div><div className="px-2"><div className="mx-auto flex h-9 w-9 items-center justify-center text-fuchsia-400"><PlayerIcon/></div><p className="mt-2 text-sm font-black">{playerCount} spelare</p></div><div className="px-2"><div className="mx-auto flex h-9 w-9 items-center justify-center text-fuchsia-400"><TokenIcon/></div><p className="mt-2 text-sm font-black">Tokens {useTokens?"på":"av"}</p></div></div><p className="mt-4 text-center text-xs text-white/35">{totalCards} kort i vald kategori</p></section>
      <button type="button" onClick={handleStart} className="w-full rounded-[1.5rem] border border-fuchsia-300/60 bg-gradient-to-r from-fuchsia-600 via-pink-500 to-fuchsia-600 py-5 text-xl font-black uppercase tracking-[0.08em] shadow-[0_0_32px_rgba(217,70,239,0.36)]">Starta spel</button>
    </div>
  </main>;
}
