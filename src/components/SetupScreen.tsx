import { useMemo, useState } from "react";
import { getCategoryCounts } from "../data/songs";
import {
  CATEGORY_META,
  PLAYER_COLORS,
  type SongCategory,
} from "../types";
import { cn } from "../utils/cn";
import { playClickSound } from "../utils/sounds";

interface SetupScreenProps {
  onStart: (names: string[], useTokens: boolean, category: SongCategory) => void;
}

const CATEGORIES: SongCategory[] = ["mixed", "pop", "swedish", "rap", "rock"];

export function SetupScreen({ onStart }: SetupScreenProps) {
  const [playerCount, setPlayerCount] = useState(2);
  const [names, setNames] = useState(["", ""]);
  const [useTokens, setUseTokens] = useState(true);
  const [category, setCategory] = useState<SongCategory>("mixed");
  const counts = useMemo(() => getCategoryCounts(), []);

  const updateCount = (count: number) => {
    playClickSound();
    setPlayerCount(count);
    setNames((prev) => {
      const next = [...prev];
      while (next.length < count) next.push("");
      return next.slice(0, count);
    });
  };

  const handleStart = () => {
    playClickSound();
    const finalNames = names.map((n, i) => n.trim() || `Spelare ${i + 1}`);
    onStart(finalNames, useTokens, category);
  };

  return (
    <div className="relative mx-auto flex min-h-screen max-w-xl flex-col justify-center px-4 py-12">
      {/* Hero */}
      <div className="mb-10 text-center">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-400/25 bg-violet-500/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-violet-200 shadow-[0_0_24px_rgba(139,92,246,0.2)]">
          <span className="relative flex h-2 w-2">
            <span className="absolute inset-0 animate-ping rounded-full bg-violet-400 opacity-60" />
            <span className="relative h-2 w-2 rounded-full bg-violet-300" />
          </span>
          Musik · Tidslinje · Party
        </div>

        <div className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-500/40 to-amber-400/30 blur-2xl" />
          <div className="spin-slow absolute inset-0 rounded-full border border-dashed border-white/15" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 via-fuchsia-600 to-amber-500 shadow-2xl">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black/40">
              <div className="h-2.5 w-2.5 rounded-full bg-white" />
            </div>
          </div>
        </div>

        <h1 className="brand-text text-6xl font-black tracking-tighter sm:text-7xl">
          BeatLine
        </h1>
        <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-white/55">
          Lyssna, gissa året och bygg din tidslinje.{" "}
          <span className="font-semibold text-fuchsia-300">Pressa lyckan</span>{" "}
          – men stanna innan det brister.
        </p>
        <p className="mt-2 text-xs font-medium text-white/35">
          {counts.mixed.toLocaleString("sv-SE")} låtar · du styr play själv
        </p>
      </div>

      <div className="glass-panel space-y-6 rounded-[1.75rem] p-5 sm:p-7">
        {/* Category */}
        <section>
          <label className="mb-3 block text-[11px] font-bold uppercase tracking-[0.2em] text-white/40">
            Kategori
          </label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {CATEGORIES.map((key) => {
              const meta = CATEGORY_META[key];
              const selected = category === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setCategory(key);
                  }}
                  className={cn(
                    "rounded-2xl border p-3.5 text-left transition duration-200",
                    selected
                      ? "border-white/25 bg-white/10 shadow-lg"
                      : "border-white/8 bg-black/20 hover:border-white/15 hover:bg-white/5"
                  )}
                  style={
                    selected
                      ? {
                          boxShadow: `0 0 28px ${meta.color}30`,
                          borderColor: `${meta.color}55`,
                        }
                      : undefined
                  }
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{meta.emoji}</span>
                      <span className="font-bold text-white">{meta.label}</span>
                    </div>
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums"
                      style={{ color: meta.color, background: `${meta.color}22` }}
                    >
                      {counts[key]}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] leading-snug text-white/40">
                    {meta.description}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Players */}
        <section>
          <label className="mb-3 block text-[11px] font-bold uppercase tracking-[0.2em] text-white/40">
            Antal spelare
          </label>
          <div className="grid grid-cols-6 gap-2">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => updateCount(n)}
                className={cn(
                  "flex h-12 items-center justify-center rounded-2xl text-sm font-bold transition",
                  playerCount === n
                    ? "scale-105 bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-[0_8px_24px_rgba(168,85,247,0.4)]"
                    : "bg-white/5 text-white/45 ring-1 ring-white/10 hover:bg-white/10 hover:text-white"
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <label className="block text-[11px] font-bold uppercase tracking-[0.2em] text-white/40">
            Spelarnamn
          </label>
          {names.map((name, i) => (
            <div key={i} className="flex items-center gap-3">
              <div
                className="h-3.5 w-3.5 shrink-0 rounded-full"
                style={{
                  backgroundColor: PLAYER_COLORS[i],
                  boxShadow: `0 0 14px ${PLAYER_COLORS[i]}99`,
                }}
              />
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  const next = [...names];
                  next[i] = e.target.value;
                  setNames(next);
                }}
                placeholder={`Spelare ${i + 1}`}
                maxLength={16}
                className="w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-white placeholder:text-white/25 focus:border-violet-400/40 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
              />
            </div>
          ))}
        </section>

        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-black/25 p-4 transition hover:border-white/20">
          <input
            type="checkbox"
            checked={useTokens}
            onChange={(e) => setUseTokens(e.target.checked)}
            className="mt-1 h-4 w-4 rounded accent-violet-500"
          />
          <div>
            <div className="font-semibold text-white">Tokens</div>
            <p className="mt-0.5 text-sm leading-relaxed text-white/45">
              Hoppa över låtar (1 token). Streak ×3 ger bonus-token vid bankning.
            </p>
          </div>
        </label>

        <div className="rounded-2xl border border-violet-400/15 bg-violet-500/5 p-4 text-sm text-white/70">
          <div className="mb-2 font-bold text-violet-200">Snabbt om spelet</div>
          <ol className="list-decimal space-y-1.5 pl-4 text-white/45">
            <li>
              Tryck <strong className="text-white">play</strong> när ni vill höra låten
            </li>
            <li>Eller skanna QR till Spotify/YouTube</li>
            <li>Placera rätt på tidslinjen – fortsätt eller stanna</li>
            <li>Fel svar nollställer rundans pott · först till 10 vinner</li>
          </ol>
        </div>

        <button
          type="button"
          onClick={handleStart}
          className="group relative w-full overflow-hidden rounded-2xl py-4 text-lg font-black text-white transition hover:scale-[1.015] active:scale-[0.985]"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-amber-400" />
          <div className="absolute inset-0 opacity-0 transition group-hover:opacity-100 bg-gradient-to-r from-violet-500 via-fuchsia-400 to-amber-300" />
          <span className="relative">Starta BeatLine · {CATEGORY_META[category].label}</span>
        </button>
      </div>
    </div>
  );
}
